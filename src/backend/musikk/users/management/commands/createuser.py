from django.core.management.base import BaseCommand, CommandError
from users.management.helpers import create_user_with_password


class Command(BaseCommand):
    help = "Creates a user of a given type and prints their password"

    def add_arguments(self, parser):
        parser.add_argument("--type", required=True, type=str)
        parser.add_argument("--email", type=str)

    def handle(self, *args, **options):
        try:
            user, password = create_user_with_password(
                user_type=options["type"], email=options.get("email")
            )
        except ValueError as e:
            raise CommandError(str(e))

        self.stdout.write(
            self.style.SUCCESS(f"{user.__class__.__name__} created: {user.email}")
        )
        self.stdout.write(self.style.WARNING(f"Password: {password}"))
