from dj_rest_auth.registration.serializers import RegisterSerializer
from rest_framework import serializers

from base.serializers import BaseModelSerializer
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
    class Meta(BaseUserSerializer.Meta):
        model = BaseUser
        fields = BaseUserSerializer.Meta.fields + ["email"]
