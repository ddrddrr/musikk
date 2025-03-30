from rest_framework import serializers

from base.serializers import BaseModelSerializer
from streaming.song_collections import SongCollection
from streaming.songs import BaseSong, SongCollectionSong


class SongSerializer(BaseModelSerializer):
    class Meta:
        model = BaseSong
        fields = BaseModelSerializer.Meta.fields + ["title", "description", "mpd"]


class SongCollectionSongSerializer(serializers.ModelSerializer):
    class Meta:
        model = SongCollectionSong
        fields = BaseModelSerializer.Meta.fields + [
            "song",
            "position",
            "song_collection",
        ]


class SongCollectionSerializerBasic(BaseModelSerializer):
    class Meta:
        model = SongCollection
        fields = BaseModelSerializer.Meta.fields + [
            "title",
            "image",
        ]


class SongCollectionSerializerDetailed(BaseModelSerializer):
    songs = SongCollectionSongSerializer(many=True, read_only=True)

    class Meta(SongCollectionSerializerBasic.Meta):
        fields = SongCollectionSerializerBasic.Meta.fields + [
            "songs",
            # "metadata",
            # "image"
        ]
