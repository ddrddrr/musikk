from rest_framework import serializers

from base.serializers import BaseModelSerializer
from streaming.api.v1.serializers.songs import CollectionSongRetrieveSerializer
from streaming.models.song_queue import QueueItem, SongQueue


class QueueItemSerializer(BaseModelSerializer):
    collection_song = CollectionSongRetrieveSerializer(read_only=True)

    class Meta:
        model = QueueItem
        fields = BaseModelSerializer.Meta.fields + [
            "collection_song",
            "origin",
            "position",
        ]


class SongQueueSerializer(BaseModelSerializer):
    current_song = serializers.SerializerMethodField()
    items = serializers.SerializerMethodField()

    class Meta:
        model = SongQueue
        fields = BaseModelSerializer.Meta.fields + [
            "current_song",
            "items",
        ]

    def get_current_song(self, obj):
        if not obj.current_collection_song:
            return None
        return CollectionSongRetrieveSerializer(
            obj.current_collection_song, context=self.context
        ).data

    def get_items(self, obj):
        items = obj.window()
        return QueueItemSerializer(items, many=True, context=self.context).data
