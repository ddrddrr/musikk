from django.conf import settings
from django.core.exceptions import ValidationError
from rest_framework import serializers

from audio_processing.ffmpeg_wrapper import FlacOnly
from base.serializers import BaseModelSerializer
from streaming.songs import BaseSong, SongCollectionSong, SongAuthor
from users.api.v1.serializers_base import BaseUserSerializer
from users.users_extended import Artist


class BaseSongSerializer(BaseModelSerializer):
    mpd = serializers.SerializerMethodField(read_only=True)
    is_liked = serializers.SerializerMethodField(read_only=True, allow_null=True)
    authors = serializers.SerializerMethodField(read_only=True, allow_null=True)

    class Meta:
        model = BaseSong
        fields = BaseModelSerializer.Meta.fields + [
            "title",
            "image",
            "description",
            "mpd",
            "is_liked",
            "authors",
        ]

    # TODO: probably make a model method, change _ to -
    def get_mpd(self, obj):
        return (
            settings.DJANGO_BASE_URL
            + settings.MEDIA_URL
            + f"audio_content/{obj.uuid}/{obj.uuid}.mpd"
        )

    def get_is_liked(self, obj):
        if user := self.context["request"].user.streaminguser:
            return SongCollectionSong.objects.filter(
                song=obj, song_collection=user.liked_songs
            ).exists()
        raise ValidationError("User must be provided.")

    def get_authors(self, obj):
        sauthors = SongAuthor.objects.filter(song=obj).select_related("author")
        users = [sauthor.author for sauthor in sauthors]

        return BaseUserSerializer(users, many=True, context=self.context).data


class BaseSongCreateSerializer(serializers.ModelSerializer):
    audio = serializers.FileField(write_only=True)
    authors = serializers.ListField(child=serializers.UUIDField(), write_only=True)

    class Meta:
        model = BaseSong
        fields = [
            "audio",
            "authors",
            "title",
            "image",
            "description",
        ]

    def create(self, validated_data):
        res = FlacOnly.convert_song(validated_data.pop("audio"))
        authors = Artist.objects.filter(uuid__in=validated_data.pop("authors"))
        if not authors:
            raise serializers.ValidationError("Song must have at least one author.")

        instance = BaseSong(**validated_data)
        instance.mpd = res.manifests["mpd_path"]
        instance.content_path = res.song_content_path
        instance.uuid = res.uuid_
        instance.save()
        for author in authors:
            SongAuthor.objects.create(song=instance, author=author)
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


class SongCollectionSongSerializer(BaseModelSerializer):
    song = serializers.SerializerMethodField()

    class Meta:
        model = SongCollectionSong
        # song_collection will be its uuid
        fields = BaseModelSerializer.Meta.fields + ["song", "song_collection"]

    def get_song(self, obj):
        return BaseSongSerializer(obj.song, context=self.context).data