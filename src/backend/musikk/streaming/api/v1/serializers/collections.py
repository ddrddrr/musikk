from django.db import transaction
from rest_framework import serializers

from base.serializers import BaseModelSerializer, UUIDListField
from streaming.api.v1.serializers.songs import (
    CollectionSongSerializer,
)
from streaming.api.v1.serializers.validators import validate_authors
from streaming.models import BaseSong
from streaming.models.collections import Collection, CollectionCredit
from streaming.models.songs import CollectionSong
from users.api.v1.serializers import ArtistSerializer
from users.models import Artist


class CollectionSerializerBasic(BaseModelSerializer):
    authors = serializers.SerializerMethodField(read_only=True, allow_null=True)
    is_liked = serializers.SerializerMethodField(read_only=True, allow_null=True)

    class Meta:
        model = Collection
        fields = BaseModelSerializer.Meta.fields + [
            "title",
            "image",
            "authors",
            "is_liked",
            "type",
        ]
        extra_kwargs = BaseModelSerializer.Meta.extra_kwargs | {
            "title": {"read_only": True},
            "image": {"read_only": True},
        }

    def get_is_liked(self, obj):
        return (
            self.context["request"]
            .user.streamingprofile.followed_collections.filter(pk=obj.pk)
            .exists()
        )

    def get_authors(self, obj):
        collection_credits = CollectionCredit.objects.filter(
            collection=obj
        ).select_related("author")

        return ArtistSerializer(
            [cc.author for cc in collection_credits], many=True, context=self.context
        ).data


class CollectionSerializerDetailed(CollectionSerializerBasic):
    songs = serializers.SerializerMethodField()

    class Meta(CollectionSerializerBasic.Meta):
        model = Collection
        fields = CollectionSerializerBasic.Meta.fields + [
            "songs",
            "description",
        ]

        extra_kwargs = CollectionSerializerBasic.Meta.extra_kwargs | {
            "songs": {"read_only": True},
            "description": {"read_only": True},
        }

    def get_songs(self, obj):
        return CollectionSongSerializer(
            CollectionSong.objects.filter(collection=obj)
            .select_related("song")
            .filter(song__draft=False),
            context=self.context,
            many=True,
        ).data


class CollectionCreateSerializer(serializers.ModelSerializer):
    authors = UUIDListField(required=False, write_only=True)
    songs = UUIDListField(write_only=True)

    class Meta:
        model = Collection
        fields = ["authors", "songs", "title", "description", "image", "type"]

    def create(self, validated_data):
        author_uuids = validated_data.pop("authors", None)
        authors = validate_authors(author_uuids or [self.context["request"].user])

        song_uuids = validated_data.pop("songs")
        songs_qs = BaseSong.objects.filter(authors__uuid__in=author_uuids).filter(
            uuid__in=song_uuids
        )
        if len(songs_qs) != len(song_uuids):
            raise serializers.ValidationError("Some of the songs were not found.")

        with transaction.atomic():
            collection = Collection.objects.create(**validated_data)
            CollectionSong.objects.bulk_create(
                [
                    CollectionSong(collection=collection, song=song, position=i)
                    for i, song in enumerate(songs_qs)
                ]
            )
            CollectionCredit.objects.bulk_create(
                [
                    CollectionCredit(
                        collection=collection, author=author, author_priority=i
                    )
                    for i, author in enumerate(authors)
                ]
            )

            songs_qs.update(draft=False)

        return collection
