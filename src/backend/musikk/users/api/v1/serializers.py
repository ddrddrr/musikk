from dj_rest_auth.registration.serializers import RegisterSerializer
from rest_framework import serializers

from base.serializers import BaseModelSerializer
from users.models import BaseUser, Artist


class BaseRegisterSerializer(RegisterSerializer):
    username = None
    is_artist = serializers.BooleanField(write_only=True, default=False)


class BaseUserSerializer(BaseModelSerializer):
    class Meta(BaseModelSerializer.Meta):
        model = BaseUser
        fields = BaseModelSerializer.Meta.fields + [
            "display_name",
            "bio",
            "avatar",
        ]


class BaseMeSerializer(BaseUserSerializer):
    class Meta(BaseUserSerializer.Meta):
        model = BaseUser
        fields = BaseUserSerializer.Meta.fields + ["email"]


class ArtistSerializer(BaseUserSerializer):
    class Meta(BaseModelSerializer.Meta):
        model = Artist
        fields = BaseModelSerializer.Meta.fields + [
            "display_name",
            "bio",
            "avatar",
        ]
