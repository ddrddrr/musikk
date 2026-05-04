from base.serializers import BaseModelSerializer, UUIDListField
from django.db import transaction
from django.db.models import Exists, OuterRef, Prefetch, QuerySet
from rest_framework import serializers
from users.api.v1.serializers import BaseUserSerializer

from streaming.api.v1.serializers.songs import (
    CollectionSongRetrieveSerializer,
)
from streaming.api.v1.serializers.validators import validate_authors
from streaming.models.collections import Collection, CollectionCredit, CollectionType
from streaming.models.songs import CollectionSong


def collection_optimizations(qs: QuerySet, user) -> QuerySet:
    """Optimize collection queries (e.g. by prefetching related objects)

    Without this, `get_authors` and `get_is_liked` each fall back
    to per-object queries.
    """
    qs = qs.prefetch_related(
        Prefetch(
            "collection_credits",
            queryset=CollectionCredit.objects.select_related("author"),
        )
    )
    if user is not None and not user.is_anonymous:
        qs = qs.annotate(
            is_liked_annotated=Exists(
                Collection.objects.filter(
                    pk=OuterRef("pk"), followers=user.streamingprofile
                )
            )
        )
    return qs


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
            "private",
        ]
        extra_kwargs = BaseModelSerializer.Meta.extra_kwargs | {
            "title": {"read_only": True},
            "image": {"read_only": True},
            "private": {"read_only": True},
        }

    def get_is_liked(self, obj) -> bool | None:
        if (annotated := getattr(obj, "is_liked_annotated", None)) is not None:
            return annotated
        user = self.context.get("user")
        if user is None and (req := self.context.get("request")) is not None:
            user = req.user
        if user is None or user.is_anonymous:
            return None
        return user.streamingprofile.followed_collections.filter(pk=obj.pk).exists()

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
