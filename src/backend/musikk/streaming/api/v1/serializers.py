from django.conf import settings
from rest_framework import serializers

from base.serializers import BaseModelSerializer
from streaming.song_collections import SongCollection, Playlist
from streaming.song_queue import SongQueue, SongQueueNode
from streaming.songs import BaseSong, SongCollectionSong


class SongSerializer(BaseModelSerializer):
    mpd = serializers.SerializerMethodField()

    class Meta:
        model = BaseSong
        fields = BaseModelSerializer.Meta.fields + ["title", "description", "mpd"]

    # TODO: probably make a model method, change _ to -
    def get_mpd(self, obj):
        return (
            settings.DJANGO_BASE_URL
            + settings.MEDIA_URL
            + f"audio_content/{obj.uuid}/{obj.uuid}.mpd"
        )


class SongCollectionSerializerBasic(BaseModelSerializer):
    class Meta:
        model = SongCollection
        fields = BaseModelSerializer.Meta.fields + [
            "title",
            "image",
        ]


class SongCollectionSerializerDetailed(BaseModelSerializer):
    songs = serializers.SerializerMethodField()

    class Meta(SongCollectionSerializerBasic.Meta):
        fields = SongCollectionSerializerBasic.Meta.fields + [
            "songs",
        ]

    def get_songs(self, obj):
        song_collection_songs = SongCollectionSong.objects.filter(song_collection=obj)
        return [
            {
                **SongSerializer(song.song).data,
                "position": song.position,
            }
            for song in song_collection_songs
        ]


class PlaylistSerializerBasic(SongCollectionSerializerBasic):
    class Meta:
        model = Playlist
        fields = SongCollectionSerializerBasic.Meta.fields + []


class SongQueueNodeSerializer(BaseModelSerializer):
    song = SongSerializer()

    class Meta:
        model = SongQueueNode
        fields = BaseModelSerializer.Meta.fields + ["song", "prev", "next"]


class SongQueueSerializer(BaseModelSerializer):
    nodes = SongQueueNodeSerializer(many=True)

    class Meta:
        model = SongQueue
        fields = BaseModelSerializer.Meta.fields + ["nodes", "head", "tail"]
