from rest_framework import serializers

from users.api.v1.serializers_base import BaseUserSerializer
from users.user_base import BaseUser
from users.users_extended import StreamingUser, Artist


class StreamingUserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    email = serializers.EmailField(write_only=True)

    class Meta:
        model = StreamingUser
        fields = ["email", "password"]

    def create(self, validated_data):
        user = StreamingUser.objects.create_user(**validated_data)
        return user


class ArtistCreateSerializer(StreamingUserCreateSerializer):
    class Meta:
        model = Artist
        fields = StreamingUserCreateSerializer.Meta.fields

    def create(self, validated_data):
        user = Artist.objects.create_user(**validated_data)
        return user
