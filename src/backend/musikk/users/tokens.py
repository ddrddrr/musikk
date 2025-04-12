from django.contrib.auth.tokens import (
    PasswordResetTokenGenerator as DjangoPwdResetTokenGenerator,
)
from django.conf import settings
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.authentication import JWTAuthentication

password_reset_token_generator = DjangoPwdResetTokenGenerator()
User = settings.AUTH_USER_MODEL


class UUIDJWTAuthentication(JWTAuthentication):
    def get_user(self, validated_token):
        try:
            uuid = validated_token["uuid"]
        except KeyError:
            raise AuthenticationFailed("No User uuid provided")

        try:
            user = User.objects.get(uuid=uuid)
        except User.DoesNotExist:
            raise AuthenticationFailed("User not found")

        if not user.is_active:
            raise AuthenticationFailed("User is inactive")

        return user
