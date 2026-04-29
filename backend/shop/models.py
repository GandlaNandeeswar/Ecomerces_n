import uuid
from decimal import Decimal
from datetime import timedelta

from django.conf import settings
from django.db import models
from django.utils import timezone


class Product(models.Model):
    name = models.CharField(max_length=200)
    price_in_inr = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.TextField(blank=True)
    image_url = models.URLField(max_length=500)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name


class Order(models.Model):
    class PaymentMethod(models.TextChoices):
        CARD = "CARD", "Card"
        UPI = "UPI", "UPI"
        COD = "COD", "Cash on Delivery"

    class PaymentStatus(models.TextChoices):
        PENDING = "PENDING", "Pending"
        PAID = "PAID", "Paid"

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="orders")
    order_number = models.CharField(max_length=40, unique=True, db_index=True)

    payment_method = models.CharField(max_length=10, choices=PaymentMethod.choices)
    payment_status = models.CharField(
        max_length=10, choices=PaymentStatus.choices, default=PaymentStatus.PENDING
    )

    placed_at = models.DateTimeField(default=timezone.now, db_index=True)
    estimated_delivery_at = models.DateTimeField()

    # Shipping fields
    full_name = models.CharField(max_length=120)
    phone = models.CharField(max_length=25)
    address_line1 = models.CharField(max_length=220)
    address_line2 = models.CharField(max_length=220, blank=True)
    city = models.CharField(max_length=120)
    state = models.CharField(max_length=120)
    postal_code = models.CharField(max_length=20)

    class Meta:
        ordering = ["-placed_at"]

    def save(self, *args, **kwargs):
        # Ensure we always have an estimate.
        if not self.estimated_delivery_at:
            self.estimated_delivery_at = timezone.now() + timedelta(minutes=25)
        if not self.order_number:
            self.order_number = uuid.uuid4().hex[:10].upper()
        super().save(*args, **kwargs)

    @property
    def total_amount_in_inr(self) -> Decimal:
        return sum((item.unit_price_in_inr * item.quantity for item in self.items.all()), Decimal("0.00"))

    def __str__(self) -> str:
        return self.order_number


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    quantity = models.PositiveIntegerField(default=1)
    unit_price_in_inr = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        unique_together = [("order", "product")]

    def __str__(self) -> str:
        return f"{self.product.name} x {self.quantity}"
