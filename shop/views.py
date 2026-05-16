from datetime import timedelta

from django.contrib.auth import get_user_model
from django.db import IntegrityError, transaction
from django.shortcuts import render
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Order, OrderItem, Product, UserProfile
from .serializers import (
    OrderCreateSerializer,
    OrderSerializer,
    OrderTrackSerializer,
    ProductSerializer,
    UserProfileSerializer,
)


def _is_admin(user) -> bool:
    return bool(user and user.is_authenticated and user.is_staff)


def _get_or_create_profile(user) -> UserProfile:
    profile, _ = UserProfile.objects.get_or_create(user=user)
    return profile


# --- Frontend pages (stubs for now) ---


def home_page(request):
    return render(request, "shop/index.html")


def product_detail_page(request, product_id: int):
    return render(request, "shop/product_detail.html")


def cart_page(request):
    return render(request, "shop/cart.html")


def checkout_page(request):
    return render(request, "shop/checkout.html")


def payment_page(request):
    return render(request, "shop/payment.html")


def orders_page(request):
    return render(request, "shop/orders.html")


def track_order_page(request, order_id: int):
    return render(request, "shop/track_order.html")


def login_page(request):
    return render(request, "auth/login.html")


def signup_page(request):
    return render(request, "auth/signup.html")


def profile_page(request):
    return render(request, "profile/profile.html", {"page_title": "My Profile | urstyle"})


def admin_login_page(request):
    return render(request, "admin_portal/login.html", {"page_title": "Admin Login | urstyle"})


def admin_dashboard_page(request):
    return render(request, "admin_portal/dashboard.html", {"page_title": "Admin Dashboard | urstyle"})


def admin_database_page(request):
    return render(
        request,
        "admin_portal/database.html",
        {"page_title": "Database Explorer | urstyle"},
    )


# --- API (DRF) ---


User = get_user_model()


@api_view(["POST"])
@permission_classes([AllowAny])
def api_register(request):
    payload = request.data or {}
    username = (payload.get("username") or "").strip()
    password = payload.get("password") or ""
    email = (payload.get("email") or "").strip()

    if not username or not password:
        return Response({"detail": "username and password are required."}, status=status.HTTP_400_BAD_REQUEST)
    if User.objects.filter(username=username).exists():
        return Response({"detail": "Username already exists."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = User.objects.create_user(username=username, email=email or "", password=password)
    except IntegrityError:
        return Response({"detail": "Username already exists."}, status=status.HTTP_400_BAD_REQUEST)
    except Exception:
        return Response({"detail": "Unable to create account. Please try again."}, status=status.HTTP_400_BAD_REQUEST)

    refresh = RefreshToken.for_user(user)
    _get_or_create_profile(user)
    return Response({"access": str(refresh.access_token), "refresh": str(refresh)}, status=status.HTTP_201_CREATED)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def api_me(request):
    profile = _get_or_create_profile(request.user)
    return Response(
        {
            "id": request.user.id,
            "username": request.user.username,
            "email": request.user.email,
            "is_staff": request.user.is_staff,
            "profile": UserProfileSerializer(profile).data,
        }
    )


@api_view(["GET", "PATCH"])
@permission_classes([IsAuthenticated])
def api_profile_me(request):
    profile = _get_or_create_profile(request.user)

    if request.method == "GET":
        return Response(UserProfileSerializer(profile).data)

    serializer = UserProfileSerializer(profile, data=request.data, partial=True)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    serializer.save()
    return Response(UserProfileSerializer(profile).data)


@api_view(["GET", "POST"])
@permission_classes([AllowAny])
def api_products_list(request):
    if request.method == "GET":
        if _is_admin(request.user):
            products = Product.objects.all().order_by("name")
        else:
            products = Product.objects.filter(is_active=True).order_by("name")
        return Response(ProductSerializer(products, many=True).data)

    # POST: admin-only write
    if not _is_admin(request.user):
        return Response({"detail": "Admin only."}, status=status.HTTP_403_FORBIDDEN)

    serializer = ProductSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    product = serializer.save()
    return Response(ProductSerializer(product).data, status=status.HTTP_201_CREATED)


@api_view(["GET", "PUT", "PATCH", "DELETE"])
@permission_classes([AllowAny])
def api_products_detail(request, product_id: int):
    try:
        product = Product.objects.get(pk=product_id)
    except Product.DoesNotExist:
        return Response({"detail": "Product not found."}, status=status.HTTP_404_NOT_FOUND)

    is_admin = _is_admin(request.user)
    if not is_admin and not product.is_active and request.method in ("GET",):
        return Response({"detail": "Product not found."}, status=status.HTTP_404_NOT_FOUND)

    if request.method == "GET":
        if not product.is_active and not is_admin:
            return Response({"detail": "Product not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(ProductSerializer(product).data)

    if not is_admin:
        return Response({"detail": "Admin only."}, status=status.HTTP_403_FORBIDDEN)

    if request.method == "DELETE":
        product.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    partial = request.method == "PATCH"
    serializer = ProductSerializer(product, data=request.data, partial=partial)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    serializer.save()
    return Response(serializer.data)


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def api_orders_list_create(request):
    if request.method == "GET":
        orders = (
            Order.objects.filter(user=request.user)
            .prefetch_related("items__product")
            .order_by("-placed_at")
        )
        return Response(OrderSerializer(orders, many=True).data)

    serializer = OrderCreateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    now = timezone.now()
    shipping = data["shipping"]

    with transaction.atomic():
        return _create_order_with_items(request, data, now, shipping)


def _create_order_with_items(request, data, now, shipping):
    order = Order.objects.create(
        user=request.user,
        payment_method=data["payment_method"],
        payment_status=Order.PaymentStatus.PENDING,
        placed_at=now,
        estimated_delivery_at=now + timedelta(minutes=25),
        full_name=shipping["full_name"],
        phone=shipping["phone"],
        address_line1=shipping["address_line1"],
        address_line2=shipping.get("address_line2", ""),
        city=shipping["city"],
        state=shipping["state"],
        postal_code=shipping["postal_code"],
    )

    # Create order items from product snapshot prices and reduce inventory.
    for item in data["items"]:
        product = Product.objects.select_for_update().get(pk=item["product_id"])
        if product.stock_quantity < item["quantity"]:
            order.delete()
            return Response(
                {"detail": f"Not enough stock for {product.name}."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        product.stock_quantity -= item["quantity"]
        product.save(update_fields=["stock_quantity"])
        order.items.create(
            product=product,
            quantity=item["quantity"],
            unit_price_in_inr=product.price_in_inr,
        )

    order.refresh_from_db()
    return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def api_orders_track(request, order_id: int):
    try:
        order = (
            Order.objects.filter(user=request.user)
            .prefetch_related("items__product")
            .get(pk=order_id)
        )
    except Order.DoesNotExist:
        return Response({"detail": "Order not found."}, status=status.HTTP_404_NOT_FOUND)

    return Response(OrderTrackSerializer(order).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def api_orders_mark_paid(request, order_id: int):
    try:
        order = Order.objects.get(pk=order_id, user=request.user)
    except Order.DoesNotExist:
        return Response({"detail": "Order not found."}, status=status.HTTP_404_NOT_FOUND)

    if order.payment_method in (Order.PaymentMethod.CARD, Order.PaymentMethod.UPI):
        order.payment_status = Order.PaymentStatus.PAID
        order.save(update_fields=["payment_status"])
    else:
        # COD is not “paid” in this demo until delivery.
        return Response(
            {"detail": "COD order will be marked paid after delivery (demo)."},
            status=status.HTTP_200_OK,
        )

    order.refresh_from_db()
    return Response(OrderTrackSerializer(order).data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def api_admin_database(request):
    if not _is_admin(request.user):
        return Response({"detail": "Admin only."}, status=status.HTTP_403_FORBIDDEN)

    from django.contrib.auth import get_user_model

    User = get_user_model()

    users = [
        {
            "id": u.id,
            "username": u.username,
            "email": u.email,
            "is_staff": u.is_staff,
            "date_joined": u.date_joined.isoformat() if u.date_joined else None,
        }
        for u in User.objects.all().order_by("username")
    ]

    profiles = [
        {
            "id": p.id,
            "user_id": p.user_id,
            "username": p.user.username,
            "full_name": p.full_name,
            "phone": p.phone,
            "city": p.city,
            "state": p.state,
            "postal_code": p.postal_code,
        }
        for p in UserProfile.objects.select_related("user").all().order_by("user__username")
    ]

    products = list(Product.objects.all().order_by("name").values())
    for row in products:
        row["price_in_inr"] = str(row["price_in_inr"])

    orders = []
    for order in Order.objects.select_related("user").prefetch_related("items__product").order_by("-placed_at"):
        orders.append(
            {
                "id": order.id,
                "order_number": order.order_number,
                "username": order.user.username,
                "payment_method": order.payment_method,
                "payment_status": order.payment_status,
                "placed_at": order.placed_at.isoformat(),
                "total_in_inr": str(order.total_amount_in_inr),
                "items": [
                    {
                        "product": item.product.name,
                        "quantity": item.quantity,
                        "unit_price_in_inr": str(item.unit_price_in_inr),
                    }
                    for item in order.items.all()
                ],
            }
        )

    order_items = [
        {
            "id": item.id,
            "order_id": item.order_id,
            "product_id": item.product_id,
            "product_name": item.product.name,
            "quantity": item.quantity,
            "unit_price_in_inr": str(item.unit_price_in_inr),
        }
        for item in OrderItem.objects.select_related("product").all().order_by("id")
    ]

    return Response(
        {
            "database_file": "db.sqlite3 (SQLite, in backend folder)",
            "tables": {
                "users": users,
                "user_profiles": profiles,
                "products": products,
                "orders": orders,
                "order_items": order_items,
            },
            "counts": {
                "users": len(users),
                "user_profiles": len(profiles),
                "products": len(products),
                "orders": len(orders),
                "order_items": len(order_items),
            },
        }
    )
