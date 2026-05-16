from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from shop.models import UserProfile


class Command(BaseCommand):
    help = "Create a staff admin user for the admin portal."

    def add_arguments(self, parser):
        parser.add_argument("--username", default="admin")
        parser.add_argument("--password", default="admin123")
        parser.add_argument("--email", default="admin@urstyle.com")

    def handle(self, *args, **options):
        User = get_user_model()
        username = options["username"]
        password = options["password"]
        email = options["email"]

        user, created = User.objects.get_or_create(
            username=username,
            defaults={"email": email, "is_staff": True, "is_superuser": True},
        )
        if not created:
            user.is_staff = True
            user.is_superuser = True
            user.email = email
            user.save()

        user.set_password(password)
        user.save()

        UserProfile.objects.get_or_create(user=user, defaults={"full_name": "Store Admin"})

        action = "Created" if created else "Updated"
        self.stdout.write(
            self.style.SUCCESS(
                f"{action} admin user '{username}'. Login at /admin-portal/login/ (password: {password})"
            )
        )
