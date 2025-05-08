from rest_framework import serializers

from base.serializers import BaseModelSerializer
from streaming.api.v1.serializers_song import (
    SongCollectionSongSerializer,
)
from streaming.song_queue import SongQueue, SongQueueNode


class SongQueueNodeSerializer(BaseModelSerializer):
    collection_song = serializers.SerializerMethodField()

    class Meta:
        model = SongQueueNode
        fields = BaseModelSerializer.Meta.fields + ["collection_song", "prev", "next"]

    def get_collection_song(self, obj):
        return SongCollectionSongSerializer(obj.song, context=self.context).data


class SongQueueSerializer(BaseModelSerializer):
    nodes = serializers.SerializerMethodField()

    class Meta:
        model = SongQueue
        fields = BaseModelSerializer.Meta.fields + ["nodes", "head", "tail"]

    def get_nodes(self, obj):
        nodes = []
        curr = obj.head
        while curr:
            nodes.append(SongQueueNodeSerializer(curr, context=self.context).data)
            if curr == obj.tail:
                break
            curr = curr.next
        return nodes
