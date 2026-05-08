import secrets

from allauth.account.adapter import DefaultAccountAdapter
from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError


def generate_numeric_code(length=6):
    return str(secrets.randbelow(10**length)).zfill(length)


class BaseAccountAdapter(DefaultAccountAdapter):
    # Duplicate emails have to be handled differently for every project,
    # hence this custom adapter (see https://github.com/Tivix/django-rest-auth/issues/243)
    def clean_email(self, email):
        email = super().clean_email(email)
        if get_user_model().objects.filter(email__iexact=email).exists():
            raise ValidationError(
                "A user is already registered with this email address."
            )
        return email

    def get_email_confirmation_url(self, request, emailconfirmation):
        return f"{settings.FRONTEND_URL}/email-confirmation/{emailconfirmation.key}"
