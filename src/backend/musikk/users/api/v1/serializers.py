from django.contrib.auth import password_validation
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from base.serializers import BaseModelSerializer
from streaming.api.v1.serializers import (
    SongCollectionSerializerBasic,
    PlaylistSerializerBasic,
)
from users.user_base import BaseUser
from users.users_extended import StreamingUser


class BaseUserSerializer(BaseModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta(BaseModelSerializer.Meta):
        model = BaseUser
        fields = BaseModelSerializer.Meta.fields + [
            "email",
            "first_name",
            "last_name",
            "display_name",
            "avatar",
            "password",
        ]


class StreamingUserSerializer(BaseUserSerializer):
    followed_song_collections = SongCollectionSerializerBasic(many=True, required=False)
    created_playlists = PlaylistSerializerBasic(many=True, required=False)

    class Meta:
        model = StreamingUser
        fields = BaseUserSerializer.Meta.fields + [
            "liked_songs",
            "followed_song_collections",
            "created_playlists",
            "song_queue",
        ]


class ResetPasswordSerializer(serializers.ModelSerializer):
    password_main = serializers.CharField(write_only=True)
    password_repeat = serializers.CharField(write_only=True)

    class Meta:
        model = BaseUser
        fields = ["password_main", "password_repeat"]

    def validate(self, data):
        password_main = data.get("password_main")
        password_repeat = data.get("password_repeat")

        if password_main != password_repeat:
            raise serializers.ValidationError(
                {"password_repeat": "The passwords don't match."}
            )

        return data

    def validate_password_main(self, password):
        password_validation.validate_password(password, self.instance)

        return password

    def update(self, instance, validated_data):
        instance.set_password(validated_data["password_main"])
        instance.save()
        return instance


class TokenPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["email"] = user.email
        token["display_name"] = user.display_name
        return token
