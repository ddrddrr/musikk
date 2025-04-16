from django.core.management.base import BaseCommand, CommandError
from django.utils.crypto import get_random_string
from faker import Faker

from users.models import StreamingUser, Artist, Label

fake = Faker()


USER_CLASSES = {
    "streaming": StreamingUser,
    "artist": Artist,
    "label": Label,
}


class Command(BaseCommand):
    help = "Creates a user of a given type and prints their password"

    def add_arguments(self, parser):
        parser.add_argument(
            "user_type", type=str, help="User type: `streaming`, `artist`, or `label`"
        )
        parser.add_argument("--email", type=str, help="Email address of the new user")

    def handle(self, *args, **options):
        user_type = options["user_type"].lower()
        email = options.get("email")
        if not email:
            email = fake.ascii_email()
        if user_type not in USER_CLASSES:
            raise CommandError(
                f"Invalid user_type. Choose from: {', '.join(USER_CLASSES.keys())}"
            )

        password = fake.password(length=10, special_chars=True, digits=True)
        UserClass = USER_CLASSES[user_type]

        user = UserClass.objects.create_user(
            email=email,
            password=password,
            username=email,
        )

        self.stdout.write(
            self.style.SUCCESS(f"{user_type.capitalize()} created: {email}")
        )
        self.stdout.write(self.style.WARNING(f"Password: {password}"))
