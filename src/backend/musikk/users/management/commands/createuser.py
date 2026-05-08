from django.core.management.base import BaseCommand, CommandError
from users.management.helpers import create_user_with_password


class Command(BaseCommand):
    help = "Creates a streaming or artist user and prints their password"

    def add_arguments(self, parser):
        parser.add_argument(
            "--type",
            required=True,
            choices=["streaming", "artist"],
            help="Type of user to create",
        )
        parser.add_argument(
            "--email",
            type=str,
            help="Optional email address for the new user. "
            "Will be randomly generated, if not provided.",
        )

    def handle(self, *args, **options):
        try:
            user, password = create_user_with_password(
                user_type=options["type"],
                email=options.get("email"),
            )
        except ValueError as e:
            raise CommandError(str(e))

        self.stdout.write(
            self.style.SUCCESS(
                f"{options['type'].capitalize()} user created: {user.email}"
            )
        )
        self.stdout.write(self.style.WARNING(f"Password: {password}"))
