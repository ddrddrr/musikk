from django.conf import settings
from rest_framework import serializers

from audio_processing.ffmpeg_wrapper import FlacOnly
from base.serializers import BaseModelSerializer
from streaming.song_collections import SongCollection, Playlist
from streaming.song_queue import SongQueue, SongQueueNode
from streaming.songs import BaseSong


class SongSerializer(BaseModelSerializer):
    mpd = serializers.SerializerMethodField(read_only=True)
    audio = serializers.FileField(write_only=True)

    class Meta:
        model = BaseSong
        fields = BaseModelSerializer.Meta.fields + [
            "title",
            "image",
            "audio",
            "description",
            "mpd",
        ]

    # TODO: probably make a model method, change _ to -
    def get_mpd(self, obj):
        return (
            settings.DJANGO_BASE_URL
            + settings.MEDIA_URL
            + f"audio_content/{obj.uuid}/{obj.uuid}.mpd"
        )

    def create(self, validated_data):
        res = FlacOnly.convert_song(validated_data.pop("audio"))
        instance = BaseSong(**validated_data)
        instance.mpd = res.manifests["mpd_path"]
        instance.content_path = res.song_content_path
        instance.save()
        return instance

    def update(self, instance, validated_data):
        if audio := validated_data.pop("audio", None):
            res = FlacOnly.convert_song(audio)
            instance.mpd = res.manifests["mpd_path"]
            instance.content_path = res.song_content_path

        instance.title = validated_data.get("title", instance.title)
        instance.description = validated_data.get("description", instance.description)
        instance.image = validated_data.get("image", instance.image)
        instance.save()
        return instance


class SongCollectionSerializerBasic(BaseModelSerializer):
    class Meta:
        model = SongCollection
        fields = BaseModelSerializer.Meta.fields + [
            "title",
            "description",
            "image",
        ]


class SongCollectionSerializerDetailed(BaseModelSerializer):
    songs = serializers.SerializerMethodField()

    class Meta(SongCollectionSerializerBasic.Meta):
        fields = SongCollectionSerializerBasic.Meta.fields + [
            "songs",
        ]

    def get_songs(self, obj):
        song_collection_songs = obj.ordered_songs()
        return [
            {
                **SongSerializer(song, context=self.context).data,
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

    def get_song(self, obj):
        song = obj.song()
        return {
            **SongSerializer(song, context=self.context).data,
        }


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


# class StreamSerializer(BaseModelSerializer):
#     user_uuid = serializers.UUIDField(source="user")
#
#     class Meta(BaseModelSerializer.Meta):
#         model = Stream
#         fields = BaseModelSerializer.Meta.fields + ["user"]
#
#     def create(self, validated_data):
#         user_uuid = validated_data.pop("user_uuid")
#         # TODO: we want to fail, if not found, but how...?
#         user = StreamingUser.objects.get(uuid=user_uuid)
#
#         return super().create(validated_data)
