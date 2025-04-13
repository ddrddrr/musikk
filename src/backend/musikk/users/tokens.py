from django.contrib.auth import get_user_model
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.authentication import JWTAuthentication

User = get_user_model()


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
