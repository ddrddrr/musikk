from django.conf import settings
from django.db import transaction
from rest_framework import serializers

from streaming.audio.ffmpeg_wrapper import FFMPEGFull, StreamingProtocol
from base.serializers import BaseModelSerializer
from streaming.songs import BaseSong, SongCollectionSong, SongAuthor
from users.api.v1.serializers_base import BaseUserSerializer
from users.users_extended import Artist


class BaseSongSerializer(BaseModelSerializer):
    mpd = serializers.SerializerMethodField(read_only=True)
    m3u8 = serializers.SerializerMethodField(read_only=True)
    is_liked = serializers.SerializerMethodField(read_only=True, allow_null=True)
    authors = serializers.SerializerMethodField(read_only=True, allow_null=True)

    class Meta:
        model = BaseSong
        fields = BaseModelSerializer.Meta.fields + [
            "title",
            "image",
            "description",
            "mpd",
            "m3u8",
            "is_liked",
            "authors",
        ]

    # TODO: make a method
    def get_mpd(self, obj):
        return (
                settings.DJANGO_BASE_URL
                + settings.MEDIA_URL
                + f"audio_content/{obj.uuid}/{obj.uuid}.mpd"
        )

    def get_m3u8(self, obj):
        return (
                settings.DJANGO_BASE_URL
                + settings.MEDIA_URL
                + f"audio_content/{obj.uuid}/{obj.uuid}.m3u8"
        )

    def get_is_liked(self, obj):
        if user := self.context["request"].user.streaminguser:
            return SongCollectionSong.objects.filter(
                song=obj, song_collection=user.liked_songs
            ).exists()
        raise serializers.ValidationError({"user": "User must be provided"})

    def get_authors(self, obj):
        sauthors = SongAuthor.objects.filter(song=obj).select_related("author")
        users = [sauthor.author for sauthor in sauthors]

        return BaseUserSerializer(users, many=True, context=self.context).data


class BaseSongCreateSerializer(serializers.ModelSerializer):
    authors = serializers.ListField(child=serializers.UUIDField(), write_only=True, required=False)

    class Meta:
        model = BaseSong
        fields = [
            "authors",
            "title",
            "image",
            "description",
        ]

    def create(self, validated_data):
        orig_authors = validated_data.pop("authors", None)
        if not orig_authors:
            orig_authors = [self.context.get("request").user.uuid]

        qs_authors = Artist.objects.filter(uuid__in=orig_authors)
        found_uuids = {str(a.uuid) for a in qs_authors}
        missing = [str(u) for u in orig_authors if str(u) not in found_uuids]
        if missing:
            raise serializers.ValidationError({
                "authors": f"Authors were not found: {', '.join(missing)}"
            })

        with transaction.atomic():
            instance = BaseSong.objects.create(**validated_data, draft=True)
            SongAuthor.objects.bulk_create([
                SongAuthor(song=instance, author=author)
                for author in qs_authors
            ])
        return instance

    def update(self, instance, validated_data):
        # TODO:
        # if audio := validated_data.pop("audio", None):
        #     # TODO: delete old audio
        #     res = Full.convert_song(audio)
        #     instance.mpd = res.manifests[StreamingProtocol.DASH]
        #     instance.m3u8 = res.manifests[StreamingProtocol.HLS]
        #     instance.content_path = res.song_content_path

        instance.title = validated_data.get("title", instance.title)
        instance.description = validated_data.get("description", instance.description)
        instance.image = validated_data.get("image", instance.image)
        instance.save()
        return instance


class SongCollectionSongSerializer(BaseModelSerializer):
    song = serializers.SerializerMethodField()

    class Meta:
        model = SongCollectionSong
        fields = BaseModelSerializer.Meta.fields + ["song", "song_collection"]

    def get_song(self, obj):
        return BaseSongSerializer(obj.song, context=self.context).data
