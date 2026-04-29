from decimal import Decimal

from django.utils import timezone
from rest_framework import serializers

from .models import Order, OrderItem, Product


class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ["id", "name", "price_in_inr", "description", "image_url", "is_active"]


class OrderItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    subtotal_in_inr = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        fields = ["id", "product", "quantity", "unit_price_in_inr", "subtotal_in_inr"]

    def get_subtotal_in_inr(self, obj: OrderItem) -> Decimal:
        return obj.unit_price_in_inr * obj.quantity


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    total_in_inr = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            "id",
            "order_number",
            "payment_method",
            "payment_status",
            "placed_at",
            "estimated_delivery_at",
            "full_name",
            "phone",
            "city",
            "total_in_inr",
            "items",
        ]

    def get_total_in_inr(self, obj: Order) -> Decimal:
        # Use DB-related items already prefetched if possible.
        return sum((i.unit_price_in_inr * i.quantity for i in obj.items.all()), Decimal("0.00"))


class ShippingSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=120)
    phone = serializers.CharField(max_length=25)
    address_line1 = serializers.CharField(max_length=220)
    address_line2 = serializers.CharField(max_length=220, allow_blank=True, required=False)
    city = serializers.CharField(max_length=120)
    state = serializers.CharField(max_length=120)
    postal_code = serializers.CharField(max_length=20)


class OrderItemCreateSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1, max_value=100)

    def validate_product_id(self, value: int) -> int:
        if not Product.objects.filter(id=value, is_active=True).exists():
            raise serializers.ValidationError("Product not found (or inactive).")
        return value


class OrderCreateSerializer(serializers.Serializer):
    payment_method = serializers.ChoiceField(choices=[("CARD", "CARD"), ("UPI", "UPI"), ("COD", "COD")])
    shipping = ShippingSerializer()
    items = OrderItemCreateSerializer(many=True, min_length=1)

    def validate(self, attrs):
        # Ensure unique product IDs in payload (avoid duplicated OrderItem).
        product_ids = [i["product_id"] for i in attrs["items"]]
        if len(product_ids) != len(set(product_ids)):
            raise serializers.ValidationError("Duplicate products in items are not allowed.")
        return attrs


class OrderTrackSerializer(serializers.ModelSerializer):
    timeline = serializers.SerializerMethodField()
    eta_seconds_remaining = serializers.SerializerMethodField()
    eta_text = serializers.SerializerMethodField()
    current_status = serializers.SerializerMethodField()
    total_in_inr = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            "id",
            "order_number",
            "payment_method",
            "payment_status",
            "placed_at",
            "estimated_delivery_at",
            "total_in_inr",
            "current_status",
            "eta_seconds_remaining",
            "eta_text",
            "timeline",
        ]

    def _format_eta(self, seconds: int) -> str:
        seconds = max(0, seconds)
        m, s = divmod(seconds, 60)
        h, m = divmod(m, 60)
        if h > 0:
            return f"{h}h {m}m {s}s"
        if m > 0:
            return f"{m}m {s}s"
        return f"{s}s"

    def _timeline_steps(self, elapsed_seconds: float):
        # Keep this aligned with the “live time tracking” requirement.
        # 0-5 min: Order Placed
        # 5-10: Preparing
        # 10-15: Shipped
        # 15-20: Out for Delivery
        # >=20: Delivered
        thresholds = [
            (0, 300, "Order Placed"),
            (300, 600, "Preparing"),
            (600, 900, "Shipped"),
            (900, 1200, "Out for Delivery"),
            (1200, None, "Delivered"),
        ]

        current_index = 4
        for i, (_, end, _) in enumerate(thresholds):
            if end is None:
                current_index = i
                break
            if elapsed_seconds < end:
                current_index = i
                break

        timeline = []
        for i, (_, end, label) in enumerate(thresholds):
            completed = i < current_index or (i == current_index and elapsed_seconds >= (thresholds[i][0]))
            # For our UX, mark previous steps as completed; current step completed only when moved past its start.
            if i == current_index:
                completed = elapsed_seconds >= thresholds[i][0]
            timeline.append({"label": label, "completed": completed})

        return timeline, thresholds[current_index][2]

    def get_total_in_inr(self, obj: Order) -> Decimal:
        return sum((i.unit_price_in_inr * i.quantity for i in obj.items.all()), Decimal("0.00"))

    def get_eta_seconds_remaining(self, obj: Order) -> int:
        return max(0, int((obj.estimated_delivery_at - timezone.now()).total_seconds()))

    def get_eta_text(self, obj: Order) -> str:
        return self._format_eta(self.get_eta_seconds_remaining(obj))

    def get_current_status(self, obj: Order) -> str:
        elapsed_seconds = (timezone.now() - obj.placed_at).total_seconds()
        _, current_status = self._timeline_steps(elapsed_seconds)
        return current_status

    def get_timeline(self, obj: Order):
        elapsed_seconds = (timezone.now() - obj.placed_at).total_seconds()
        timeline, _ = self._timeline_steps(elapsed_seconds)
        return timeline

