from base.serializers import BaseModelSerializer
from rest_framework import serializers

from streaming.api.v1.serializers.songs import CollectionSongRetrieveSerializer
from streaming.models import QueueItem, StoredPlaybackState


class QueueItemSerializer(BaseModelSerializer):
    collection_song = CollectionSongRetrieveSerializer(read_only=True)

    class Meta:
        model = QueueItem
        fields = BaseModelSerializer.Meta.fields + [
            "collection_song",
            "position",
        ]


class StoredPlaybackStateSerializer(BaseModelSerializer):
    items = serializers.SerializerMethodField()
    context_items = serializers.SerializerMethodField()

    class Meta:
        model = StoredPlaybackState
        fields = BaseModelSerializer.Meta.fields + [
            "items",
            "context_items",
        ]

    def get_items(self, obj: StoredPlaybackState):
        items = obj.playback_queue.window()
        return QueueItemSerializer(items, many=True, context=self.context).data

    def get_context_items(self, obj: StoredPlaybackState):
        context_songs = obj.collection_cursor.window()
        return CollectionSongRetrieveSerializer(
            context_songs, many=True, context=self.context
        ).data
