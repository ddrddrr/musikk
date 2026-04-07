from rest_framework import serializers

from base.serializers import BaseModelSerializer
from streaming.api.v1.serializers.songs import CollectionSongRetrieveSerializer
from streaming.models.song_queue import QueueItem, PlayerState


class QueueItemSerializer(BaseModelSerializer):
    collection_song = CollectionSongRetrieveSerializer(read_only=True)

    class Meta:
        model = QueueItem
        fields = BaseModelSerializer.Meta.fields + [
            "collection_song",
            "position",
        ]


class PlayerStateSerializer(BaseModelSerializer):
    current_song = serializers.SerializerMethodField()
    items = serializers.SerializerMethodField()
    context_items = serializers.SerializerMethodField()

    class Meta:
        model = PlayerState
        fields = BaseModelSerializer.Meta.fields + [
            "current_song",
            "items",
            "context_items",
        ]

    def get_current_song(self, obj: PlayerState):
        if not obj.current_collection_song:
            return None
        return CollectionSongRetrieveSerializer(
            obj.current_collection_song, context=self.context
        ).data

    def get_items(self, obj: PlayerState):
        items = obj.queue.window()
        return QueueItemSerializer(items, many=True, context=self.context).data

    def get_context_items(self, obj: PlayerState):
        context_songs = obj.context.window()
        return CollectionSongRetrieveSerializer(
            context_songs, many=True, context=self.context
        ).data
