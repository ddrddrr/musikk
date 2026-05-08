from base.serializers import BaseModelSerializer, UUIDListField
from django.db import transaction
from django.db.models import Prefetch, QuerySet
from rest_framework import serializers
from users.api.v1.serializers import BaseUserSerializer

from streaming.api.v1.serializers.songs import (
    CollectionSongRetrieveSerializer,
)
from streaming.api.v1.serializers.validators import validate_authors
from streaming.models.collections import Collection, CollectionCredit, CollectionType
from streaming.models.songs import CollectionSong


def collection_optimizations(qs: QuerySet) -> QuerySet:
    """Prefetch credits so `get_authors` doesn't fetch authors per-obj"""
    return qs.prefetch_related(
        Prefetch(
            "collection_credits",
            queryset=CollectionCredit.objects.select_related("author"),
        )
    )


class CollectionSerializerBasic(BaseModelSerializer):
    authors = serializers.SerializerMethodField(read_only=True, allow_null=True)

    class Meta:
        model = Collection
        fields = BaseModelSerializer.Meta.fields + [
            "title",
            "image",
            "authors",
            "type",
            "private",
            "draft",
        ]
        extra_kwargs = BaseModelSerializer.Meta.extra_kwargs | {
            "title": {"read_only": True},
            "image": {"read_only": True},
            "private": {"read_only": True},
            "draft": {"read_only": True},
        }

    def get_authors(self, obj) -> dict:
        cache = getattr(obj, "_prefetched_objects_cache", None) or {}
        if "collection_credits" in cache:
            credits = cache["collection_credits"]
        else:
            credits = CollectionCredit.objects.filter(collection=obj).select_related(
                "author"
            )

        return BaseUserSerializer(
            [cc.author for cc in credits], many=True, context=self.context
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

    def get_songs(self, obj) -> dict:
        return CollectionSongRetrieveSerializer(
            CollectionSong.objects.filter(collection=obj)
            .select_related("song")
            .filter(song__draft=False),
            context=self.context,
            many=True,
        ).data


class CollectionCreateSerializer(BaseModelSerializer):
    authors = UUIDListField(required=False, allow_empty=True, write_only=True)

    class Meta(BaseModelSerializer.Meta):
        model = Collection
        fields = BaseModelSerializer.Meta.fields + [
            "authors",
            "title",
            "description",
            "image",
            "type",
            "private",
            "draft",
        ]
        extra_kwargs = {
            **BaseModelSerializer.Meta.extra_kwargs,
        }

    def create(self, validated_data):
        author_uuids = validated_data.pop("authors", None)
        user = self.context["request"].user

        with transaction.atomic():
            collection = Collection.objects.create(**validated_data)

            if collection.type == CollectionType.PLAYLIST:
                CollectionCredit.objects.create(collection=collection, author=user)
            else:
                authors = validate_authors(author_uuids or [user.uuid])
                CollectionCredit.objects.bulk_create(
                    [
                        CollectionCredit(
                            collection=collection, author=author, author_priority=i
                        )
                        for i, author in enumerate(authors)
                    ]
                )

        return collection


class CollectionUpdateSerializer(BaseModelSerializer):
    class Meta(BaseModelSerializer.Meta):
        model = Collection
        fields = BaseModelSerializer.Meta.fields + [
            "title",
            "description",
            "image",
            "draft",
        ]

    def validate(self, attrs):
        is_publishing = (
            "draft" in attrs and attrs["draft"] is False and self.instance.draft
        )
        if is_publishing:
            unprocessed_songs = list(
                self.instance.base_songs.filter(draft=True).values_list(
                    "uuid", flat=True
                )
            )
            if unprocessed_songs:
                raise serializers.ValidationError(
                    {
                        "detail": "Some songs are not processed",
                        "songs": [str(u) for u in unprocessed_songs],
                    }
                )
        return attrs
