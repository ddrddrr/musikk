import secrets

from base.serializers import BaseModelSerializer
from dj_rest_auth.registration.serializers import RegisterSerializer
from django.conf import settings
from rest_framework import serializers

from users.models import BaseUser, UserRole


class BaseRegisterSerializer(RegisterSerializer):
    username = None
    is_artist = serializers.BooleanField(write_only=True, default=False)
    signup_password = serializers.CharField(
        write_only=True, default="", allow_blank=True
    )

    def validate_signup_password(self, value: str) -> str:
        expected = settings.SIGNUP_PASSWORD
        if expected and not secrets.compare_digest(value.encode(), expected.encode()):
            raise serializers.ValidationError("The sign-up password is wrong.")
        return value

    def save(self, request):
        user = super().save(request)
        if self.validated_data.get("is_artist"):
            user.role = UserRole.ARTIST
            user.save(update_fields=["role"])
        return user


class BaseUserSerializer(BaseModelSerializer):
    is_artist = serializers.SerializerMethodField()

    class Meta(BaseModelSerializer.Meta):
        model = BaseUser
        fields = BaseModelSerializer.Meta.fields + [
            "display_name",
            "bio",
            "avatar",
            "is_artist",
        ]

    def get_is_artist(self, obj) -> bool:
        return obj.role == UserRole.ARTIST


class BaseMeSerializer(BaseUserSerializer):
    """Read shape for `/users/me`."""

    class Meta(BaseUserSerializer.Meta):
        model = BaseUser
        fields = BaseUserSerializer.Meta.fields + ["email", "loudness_normalization"]


class MeUpdateSerializer(BaseMeSerializer):
    """Write shape for `PATCH /users/me`."""

    class Meta(BaseMeSerializer.Meta):
        model = BaseUser
        fields = ["display_name", "bio", "avatar", "loudness_normalization"]
        extra_kwargs = {
            "display_name": {"required": False},
            "bio": {"required": False, "allow_blank": True},
            "avatar": {"required": False, "allow_null": True},
        }
