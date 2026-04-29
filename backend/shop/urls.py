from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from . import views

urlpatterns = [
    # Frontend pages
    path("", views.home_page, name="home"),
    path("product/<int:product_id>/", views.product_detail_page, name="product_detail"),
    path("cart/", views.cart_page, name="cart"),
    path("checkout/", views.checkout_page, name="checkout"),
    path("payment/", views.payment_page, name="payment"),
    path("orders/", views.orders_page, name="orders"),
    path("track/<int:order_id>/", views.track_order_page, name="track_order"),

    # Auth pages
    path("auth/login/", views.login_page, name="login"),
    path("auth/signup/", views.signup_page, name="signup"),

    # API auth
    path("api/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/auth/register/", views.api_register, name="api_register"),

    # API products
    path("api/products/", views.api_products_list, name="api_products_list"),
    path("api/products/<int:product_id>/", views.api_products_detail, name="api_products_detail"),

    # API orders
    path("api/orders/", views.api_orders_list_create, name="api_orders_list_create"),
    path(
        "api/orders/<int:order_id>/track/",
        views.api_orders_track,
        name="api_orders_track",
    ),
    path(
        "api/orders/<int:order_id>/mark-paid/",
        views.api_orders_mark_paid,
        name="api_orders_mark_paid",
    ),
]

