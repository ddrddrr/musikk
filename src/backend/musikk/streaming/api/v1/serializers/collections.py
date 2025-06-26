from django.db import transaction
from rest_framework import serializers

from base.serializers import BaseModelSerializer
from streaming.api.v1.serializers.songs import (
    CollectionSongSerializer,
)
from streaming.api.v1.serializers.validators import validate_authors
from streaming.models import BaseSong
from streaming.models.collections import Collection, CollectionCredit
from streaming.models.songs import CollectionSong
from users.api.v1.serializers import BaseProfileSerializer


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
            "authors": {"read_only": True},
            "is_liked": {"read_only": True},
            "type": {"read_only": True},
        }

    def get_is_liked(self, obj):
        if profile := self.context["request"].user.streamingprofile:
            return profile.followed_collections.filter(pk=obj.pk).exists()

        raise serializers.ValidationError({"user": "User must be provided"})

    def get_authors(self, obj):
        cauthors = CollectionCredit.objects.filter(collection=obj).select_related(
            "author__baseprofile"
        )
        authors = [cauthor.author.baseprofile for cauthor in cauthors]

        return BaseProfileSerializer(authors, many=True, context=self.context).data


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
            obj.songs.all(), context=self.context, many=True
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
    type = serializers.ChoiceField(
        choices=Collection.CollectionType.choices, required=True, write_only=True
    )

    class Meta:
        model = Collection
        fields = ["authors", "songs", "title", "description", "image", "type"]

    def create(self, validated_data):
        # TODO: add support for position
        authors = validated_data.pop("authors", None)
        if not authors:
            authors = [self.context.get("request").user]
        else:
            authors = validate_authors(authors)

        # TODO: add validate songs(same as authors, maybe some generic method in general)
        songs = validated_data.pop("songs")
        songs = BaseSong.objects.filter(uuid__in=songs)
        with transaction.atomic():
            collection = Collection.objects.create(**validated_data)
            cs_objs = [
                CollectionSong(collection=collection, song=song, position=i)
                for i, song in enumerate(songs)
            ]
            CollectionSong.objects.bulk_create(cs_objs)

            cc_objs = [
                CollectionCredit(
                    collection=collection, author=author, author_priority=i
                )
                for i, author in enumerate(authors)
            ]
            CollectionCredit.objects.bulk_create(cc_objs)

            songs.update(draft=False)

        return collection
