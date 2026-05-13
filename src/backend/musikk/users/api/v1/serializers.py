from base.serializers import BaseModelSerializer
from dj_rest_auth.registration.serializers import RegisterSerializer
from rest_framework import serializers

from users.models import BaseUser, UserRole


class BaseRegisterSerializer(RegisterSerializer):
    username = None
    is_artist = serializers.BooleanField(write_only=True, default=False)

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
    """
    Read shape for `/users/me`. Extends `BaseUserSerializer` with the
    private `email` field, which is only ever exposed to the
    authenticated owner of the account and must not leak through public
    user endpoints.
    """

    class Meta(BaseUserSerializer.Meta):
        model = BaseUser
        fields = BaseUserSerializer.Meta.fields + ["email"]


class MeUpdateSerializer(BaseMeSerializer):
    """
    Write shape for `PATCH /users/me`. The field list is intentionally a
    strict subset of `BaseMeSerializer`: `role`, `email`, and
    `is_artist` are excluded because role transitions, email changes,
    and the artist flag are handled through dedicated flows rather than
    a generic profile edit. All remaining fields are optional so that
    the client can submit partial updates.
    """

    class Meta(BaseMeSerializer.Meta):
        model = BaseUser
        fields = ["display_name", "bio", "avatar"]
        extra_kwargs = {
            "display_name": {"required": False},
            "bio": {"required": False},
            "avatar": {"required": False, "allow_null": True},
        }
