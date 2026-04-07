from rest_framework import serializers

from base.serializers import BaseModelSerializer
from streaming.api.v1.serializers.collections import CollectionSerializerBasic
from streaming.models import StreamingProfile


class StreamingProfileGetSerializer(BaseModelSerializer):
    user = serializers.UUIDField(source="user.uuid", read_only=True)
    player = serializers.UUIDField(source="player.uuid", read_only=True)
    followed_collections = serializers.SerializerMethodField(read_only=True)
    history = serializers.SerializerMethodField(read_only=True)
    liked_songs = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = StreamingProfile
        fields = BaseModelSerializer.Meta.fields + [
            "user",
            "player",
            "followed_collections",
            "history",
            "liked_songs",
        ]

    def get_followed_collections(self, obj: StreamingProfile) -> list[dict]:
        return CollectionSerializerBasic(
            obj.followed_collections.all(),
            many=True,
            context=self.context,
        ).data

    def get_history(self, obj: StreamingProfile) -> dict:
        return CollectionSerializerBasic(
            obj.history,
            context=self.context,
        ).data

    def get_liked_songs(self, obj: StreamingProfile) -> dict:
        return CollectionSerializerBasic(
            obj.liked_songs,
            context=self.context,
        ).data
