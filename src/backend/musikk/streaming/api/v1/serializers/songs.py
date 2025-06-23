from django.conf import settings
from django.db import transaction
from rest_framework import serializers

from base.serializers import BaseModelSerializer
from streaming.api.v1.serializers.validators import validate_authors
from streaming.models import BaseSong, CollectionSong, SongCredit
from users.api.v1.serializers import BaseUserSerializer
from users.models import ArtistProfile


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
            return CollectionSong.objects.filter(
                song=obj, collection=user.liked_songs
            ).exists()
        raise serializers.ValidationError({"user": "User must be provided"})

    def get_authors(self, obj):
        # TODO: optimize
        sauthors = SongCredit.objects.filter(song=obj).select_related("author")
        users = [sauthor.author for sauthor in sauthors]

        return BaseUserSerializer(users, many=True, context=self.context).data


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
            instance = BaseSong.objects.create(**validated_data, draft=True)
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


class CollectionSongSerializer(BaseModelSerializer):
    song = serializers.SerializerMethodField()

    class Meta:
        model = CollectionSong
        fields = BaseModelSerializer.Meta.fields + ["song", "collection"]

    def get_song(self, obj):
        return BaseSongSerializer(obj.song, context=self.context).data
