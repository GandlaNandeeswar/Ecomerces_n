from decimal import Decimal

from django.core.management.base import BaseCommand

from shop.models import Product


PRODUCT_SEED = [
    {
        "name": "Urban Runner Sneakers",
        "price_in_inr": "1499.00",
        "description": "Lightweight everyday runner for daily comfort.",
        "image_url": "https://images.pexels.com/photos/1456706/pexels-photo-1456706.jpeg?auto=compress&cs=tinysrgb&w=1200",
    },
    {
        "name": "Cushion Step Casual Shoes",
        "price_in_inr": "1799.00",
        "description": "Soft cushioning with breathable upper fabric.",
        "image_url": "https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=1200",
    },
    {
        "name": "Street Style Loafers",
        "price_in_inr": "1399.00",
        "description": "Clean look with durable build for street-ready style.",
        "image_url": "https://images.pexels.com/photos/267202/pexels-photo-267202.jpeg?auto=compress&cs=tinysrgb&w=1200",
    },
    {
        "name": "Premium Leather Formal",
        "price_in_inr": "2499.00",
        "description": "Polished leather finish for formal events.",
        "image_url": "https://images.pexels.com/photos/19090/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=1200",
    },
    {
        "name": "Classic Denim Jacket",
        "price_in_inr": "2299.00",
        "description": "Smart fit jacket for casual and travel outfits.",
        "image_url": "https://images.pexels.com/photos/1040945/pexels-photo-1040945.jpeg?auto=compress&cs=tinysrgb&w=1200",
    },
    {
        "name": "Cotton Hoodie Navy",
        "price_in_inr": "1599.00",
        "description": "Soft hoodie with warm inner lining and front pocket.",
        "image_url": "https://images.pexels.com/photos/6311392/pexels-photo-6311392.jpeg?auto=compress&cs=tinysrgb&w=1200",
    },
    {
        "name": "Linen Summer Shirt",
        "price_in_inr": "1199.00",
        "description": "Breathable linen shirt perfect for summer days.",
        "image_url": "https://images.pexels.com/photos/4066292/pexels-photo-4066292.jpeg?auto=compress&cs=tinysrgb&w=1200",
    },
    {
        "name": "Slim Fit Chino Pants",
        "price_in_inr": "1399.00",
        "description": "Stretchable slim fit chinos for office and casual use.",
        "image_url": "https://images.pexels.com/photos/1598507/pexels-photo-1598507.jpeg?auto=compress&cs=tinysrgb&w=1200",
    },
    {
        "name": "Chrono Steel Watch",
        "price_in_inr": "3299.00",
        "description": "Elegant analog watch with stainless steel strap.",
        "image_url": "https://images.pexels.com/photos/277390/pexels-photo-277390.jpeg?auto=compress&cs=tinysrgb&w=1200",
    },
    {
        "name": "Smart Fit Digital Watch",
        "price_in_inr": "2899.00",
        "description": "Digital smartwatch with activity and sleep tracking.",
        "image_url": "https://images.pexels.com/photos/437037/pexels-photo-437037.jpeg?auto=compress&cs=tinysrgb&w=1200",
    },
    {
        "name": "Leather Strap Watch",
        "price_in_inr": "2599.00",
        "description": "Minimal design watch with premium leather strap.",
        "image_url": "https://images.pexels.com/photos/364822/pexels-photo-364822.jpeg?auto=compress&cs=tinysrgb&w=1200",
    },
    {
        "name": "City Backpack Pro",
        "price_in_inr": "1899.00",
        "description": "Spacious travel backpack with laptop compartment.",
        "image_url": "https://images.pexels.com/photos/2905238/pexels-photo-2905238.jpeg?auto=compress&cs=tinysrgb&w=1200",
    },
    {
        "name": "Polarized Sunglasses",
        "price_in_inr": "999.00",
        "description": "UV-protected sunglasses with lightweight frame.",
        "image_url": "https://images.pexels.com/photos/46710/pexels-photo-46710.jpeg?auto=compress&cs=tinysrgb&w=1200",
    },
]


class Command(BaseCommand):
    help = "Seed attractive multi-category INR products into the Product table."

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

