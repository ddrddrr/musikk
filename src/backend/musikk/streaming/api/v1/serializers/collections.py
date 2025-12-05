from django.db import transaction
from rest_framework import serializers

from base.serializers import BaseModelSerializer
from streaming.api.v1.serializers.songs import (
    CollectionSongGetSerializer,
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
        ]
        extra_kwargs = BaseModelSerializer.Meta.extra_kwargs | {
            "title": {"read_only": True},
            "image": {"read_only": True},
        }

    def get_is_liked(self, obj):
        if profile := self.context["request"].user.streamingprofile:
            return profile.followed_collections.filter(pk=obj.pk).exists()

        raise serializers.ValidationError({"user": "User must be provided"})

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
        return CollectionSongGetSerializer(
            CollectionSong.objects.filter(collection=obj),
            context=self.context,
            many=True,
        ).data


class CollectionCreateSerializer(serializers.ModelSerializer):
    authors = serializers.ListField(
        child=serializers.UUIDField(),
        write_only=True,
        help_text="UUIDs of `BaseUser` model.",
    )
    songs = serializers.ListField(
        child=serializers.UUIDField(),
        write_only=True,
        help_text="UUIDs of `BaseSong` model.",
    )

    class Meta:
        model = Collection
        fields = ["authors", "songs", "title", "description", "image", "type"]

    def create(self, validated_data):
        # TODO: add support for position
        author_uuids = validated_data.pop("authors", None)
        authors: list[Artist]
        if not author_uuids:
            authors = [self.context.get("request").user]
        else:
            authors = validate_authors(author_uuids)

        # TODO: add validate songs(same as authors, maybe some generic method in general)
        song_uuids = validated_data.pop("songs")
        song_uuids = BaseSong.objects.filter(uuid__in=song_uuids)
        with transaction.atomic():
            collection = Collection.objects.create(**validated_data)
            cs_objs = [
                CollectionSong(collection=collection, song=song, position=i)
                for i, song in enumerate(song_uuids)
            ]
            CollectionSong.objects.bulk_create(cs_objs)

            cc_objs = [
                CollectionCredit(
                    collection=collection, author=author, author_priority=i
                )
                for i, author in enumerate(authors)
            ]
            CollectionCredit.objects.bulk_create(cc_objs)

            song_uuids.update(draft=False)

        return collection
