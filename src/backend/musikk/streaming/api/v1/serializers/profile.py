from base.serializers import BaseModelSerializer
from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from streaming.api.v1.serializers.collections import CollectionSerializerBasic
from streaming.models import StreamingProfile


class StreamingProfileGetSerializer(BaseModelSerializer):
    user = serializers.UUIDField(source="user.uuid", read_only=True)
    player = serializers.UUIDField(source="stored_playback_state.uuid", read_only=True)
    liked_collections = serializers.SerializerMethodField(read_only=True)
    history = serializers.SerializerMethodField(read_only=True)
    liked_songs = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = StreamingProfile
        fields = BaseModelSerializer.Meta.fields + [
            "user",
            "player",
            "liked_collections",
            "history",
            "liked_songs",
        ]

    @extend_schema_field(CollectionSerializerBasic(many=True))
    def get_liked_collections(self, obj: StreamingProfile):
        return CollectionSerializerBasic(
            obj.liked_collections.all(),
            many=True,
            context=self.context,
        ).data

    @extend_schema_field(CollectionSerializerBasic)
    def get_history(self, obj: StreamingProfile):
        return CollectionSerializerBasic(
            obj.history,
            context=self.context,
        ).data

    @extend_schema_field(CollectionSerializerBasic)
    def get_liked_songs(self, obj: StreamingProfile):
        return CollectionSerializerBasic(
            obj.liked_songs,
            context=self.context,
        ).data
