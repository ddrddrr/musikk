from base.serializers import BaseModelSerializer
from django.core.files.storage import default_storage
from django.db import transaction
from rest_framework import serializers
from users.api.v1.serializers import BaseUserSerializer

from streaming.api.v1.serializers.validators import validate_authors
from streaming.models import BaseSong, CollectionSong, SongCredit
from streaming.models.songs import SongStatus


class BaseSongRetrieveSerializer(BaseModelSerializer):
    mpd = serializers.SerializerMethodField(read_only=True)
    m3u8 = serializers.SerializerMethodField(read_only=True)
    authors = serializers.SerializerMethodField(read_only=True, allow_null=True)

    class Meta:
        model = BaseSong
        fields = BaseModelSerializer.Meta.fields + [
            "title",
            "image",
            "description",
            "mpd",
            "m3u8",
            "authors",
            "duration_ms",
            "loudness_lufs",
            "true_peak_dbtp",
        ]

    def get_mpd(self, obj):
        return default_storage.url(obj.mpd)

    def get_m3u8(self, obj):
        return default_storage.url(obj.m3u8)

    def get_authors(self, obj):
        cache = getattr(obj, "_prefetched_objects_cache", None) or {}
        if "credits" in cache:
            sauthors = cache["credits"]
        else:
            sauthors = SongCredit.objects.filter(song=obj).select_related("author")

        return BaseUserSerializer(
            [sauthor.author for sauthor in sauthors],
            many=True,
            context=self.context,
        ).data


class BaseSongCreateSerializer(serializers.ModelSerializer):
    authors = serializers.ListField(
        child=serializers.UUIDField(), write_only=True, required=False
    )

    class Meta:
        model = BaseSong
        fields = [
            "authors",
            "title",
            "image",
            "description",
        ]

    def create(self, validated_data):
        authors = validated_data.pop("authors", None)
        if not authors:
            authors = [self.context.get("request").user]
        else:
            authors = validate_authors(authors)

        with transaction.atomic():
            instance = BaseSong.objects.create(
                **validated_data, status=SongStatus.QUEUED
            )
            SongCredit.objects.bulk_create(
                [SongCredit(song=instance, author=author) for author in authors]
            )
        return instance

    def update(self, instance, validated_data):
        # TODO: authors
        instance.title = validated_data.get("title", instance.title)
        instance.description = validated_data.get("description", instance.description)
        instance.image = validated_data.get("image", instance.image)
        instance.save()
        return instance


class CollectionSongRetrieveSerializer(BaseModelSerializer):
    song = serializers.SerializerMethodField()

    class Meta:
        model = CollectionSong
        fields = BaseModelSerializer.Meta.fields + ["song", "collection"]

    def get_song(self, obj) -> dict:
        return BaseSongRetrieveSerializer(obj.song, context=self.context).data


class AlbumTrackUploadSerializer(serializers.Serializer):
    """
    The fields of an album track upload that are not song fields. The client
    picks `operation_id` and `position`, so a repeated request finds its row
    again, and the track order follows the form instead of the order in
    which the uploads finish.
    """

    operation_id = serializers.UUIDField()
    position = serializers.IntegerField(min_value=0)
    audio = serializers.FileField()


class AlbumTrackSerializer(serializers.ModelSerializer):
    collection_song_uuid = serializers.UUIDField(source="uuid", read_only=True)
    song_uuid = serializers.UUIDField(source="song.uuid", read_only=True)
    title = serializers.CharField(source="song.title", read_only=True)
    status = serializers.CharField(source="song.status", read_only=True)
    status_detail = serializers.CharField(source="song.status_detail", read_only=True)

    class Meta:
        model = CollectionSong
        fields = [
            "collection_song_uuid",
            "song_uuid",
            "title",
            "position",
            "status",
            "status_detail",
            "operation_id",
        ]
        read_only_fields = fields
