from decimal import Decimal

from django.core.management.base import BaseCommand

from shop.models import Product


PRODUCT_SEED = [
    {
        "name": "Urban Runner Sneakers",
        "price_in_inr": "1499.00",
        "description": "Lightweight everyday runner for daily comfort.",
        "image_url": "https://source.unsplash.com/featured/1200x800/?shoes&sig=101",
    },
    {
        "name": "Cushion Step Casual Shoes",
        "price_in_inr": "1799.00",
        "description": "Soft cushioning with breathable upper fabric.",
        "image_url": "https://source.unsplash.com/featured/1200x800/?sneakers&sig=102",
    },
    {
        "name": "Street Style Loafers",
        "price_in_inr": "1399.00",
        "description": "Clean look with durable build for street-ready style.",
        "image_url": "https://source.unsplash.com/featured/1200x800/?loafers&sig=103",
    },
    {
        "name": "Premium Leather Formal",
        "price_in_inr": "2499.00",
        "description": "Polished leather finish for formal events.",
        "image_url": "https://source.unsplash.com/featured/1200x800/?leather-shoes&sig=104",
    },
    {
        "name": "Everyday Sports Trainers",
        "price_in_inr": "1899.00",
        "description": "Supportive trainers for gym and outdoor walks.",
        "image_url": "https://source.unsplash.com/featured/1200x800/?trainers&sig=105",
    },
    {
        "name": "Comfort Cloud Slip-ons",
        "price_in_inr": "999.00",
        "description": "Easy slip-on design with all-day comfort.",
        "image_url": "https://source.unsplash.com/featured/1200x800/?slip-ons&sig=106",
    },
    {
        "name": "Trail Grip Outdoor Shoes",
        "price_in_inr": "2199.00",
        "description": "Grip-focused outsole for off-road and trails.",
        "image_url": "https://source.unsplash.com/featured/1200x800/?outdoor-shoes&sig=107",
    },
    {
        "name": "Classic Court Sneakers",
        "price_in_inr": "1599.00",
        "description": "Classic court vibe with modern cushioning.",
        "image_url": "https://source.unsplash.com/featured/1200x800/?court-shoes&sig=108",
    },
]


class Command(BaseCommand):
    help = "Seed 7-10 INR shoe products into the Product table."

    def handle(self, *args, **options):
        created = 0
        updated = 0

        for p in PRODUCT_SEED:
            obj, was_created = Product.objects.get_or_create(
                name=p["name"],
                defaults={
                    "price_in_inr": Decimal(p["price_in_inr"]),
                    "description": p.get("description", ""),
                    "image_url": p["image_url"],
                    "is_active": True,
                },
            )
            if not was_created:
                # Keep seed data in sync (idempotent).
                obj.price_in_inr = Decimal(p["price_in_inr"])
                obj.description = p.get("description", "")
                obj.image_url = p["image_url"]
                obj.is_active = True
                obj.save()
                updated += 1
            else:
                created += 1

        self.stdout.write(self.style.SUCCESS(f"Seed done. Created={created}, Updated={updated}."))

