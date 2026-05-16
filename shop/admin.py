from django.contrib import admin

from .models import Order, OrderItem, Product, UserProfile


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("name", "price_in_inr", "stock_quantity", "is_active")
    search_fields = ("name",)
    list_filter = ("is_active",)


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "full_name", "phone", "city")
    search_fields = ("user__username", "full_name", "phone")


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ("order_number", "user", "payment_status", "placed_at")
    search_fields = ("order_number", "user__username")
    list_filter = ("payment_status", "payment_method")
    inlines = [OrderItemInline]
