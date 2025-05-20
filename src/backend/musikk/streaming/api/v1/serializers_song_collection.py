from rest_framework import serializers

from base.serializers import BaseModelSerializer
from streaming.api.v1.serializers_song import (
    SongCollectionSongSerializer,
)
from streaming.song_collections import SongCollection, SongCollectionAuthor
from streaming.songs import SongCollectionSong, BaseSong
from users.api.v1.serializers_base import BaseUserSerializer
from users.users_extended import StreamingUser


class SongCollectionSerializerBasic(BaseModelSerializer):
    authors = serializers.SerializerMethodField(read_only=True, allow_null=True)
    is_liked = serializers.SerializerMethodField(read_only=True, allow_null=True)

    class Meta:
        model = SongCollection
        fields = BaseModelSerializer.Meta.fields + [
            "title",
            "image",
            "authors",
            "is_liked",
            "type",
        ]
        extra_kwargs = BaseModelSerializer.Meta.extra_kwargs | {
            "title": {"read_only": True},
            "description": {"read_only": True},
            "image": {"read_only": True},
        }

    def get_authors(self, obj):
        scauthors = SongCollectionAuthor.objects.filter(
            song_collection=obj
        ).select_related("author")
        users = [scauthor.author for scauthor in scauthors]

        return BaseUserSerializer(users, many=True, context=self.context).data

    def get_is_liked(self, obj):
        if user := self.context["request"].user.streaminguser:
            return user.followed_song_collections.filter(pk=obj.pk).exists()

        raise serializers.ValidationError({"user": "User must be provided"})


class SongCollectionSerializerDetailed(SongCollectionSerializerBasic):
    songs = serializers.SerializerMethodField()

    class Meta(SongCollectionSerializerBasic.Meta):
        model = SongCollection
        fields = SongCollectionSerializerBasic.Meta.fields + [
            "songs",
            "description",
        ]

        extra_kwargs = SongCollectionSerializerBasic.Meta.extra_kwargs | {
            "songs": {"read_only": True},
            "description": {"read_only": True},
        }

    def get_songs(self, obj):
        return SongCollectionSongSerializer(
            obj.songs_links.all(), context=self.context, many=True
        ).data


class SongCollectionCreateSerializer(serializers.ModelSerializer):
    authors = serializers.ListField(child=serializers.UUIDField(), write_only=True)
    songs = serializers.ListField(child=serializers.UUIDField(), write_only=True)
    type = serializers.ChoiceField(
        choices=SongCollection.CollectionType.choices, required=True, write_only=True
    )

    class Meta:
        model = SongCollection
        fields = ["authors", "songs", "title", "description", "image", "type"]

    def create(self, validated_data):
        authors = validated_data.pop("authors")
        songs = validated_data.pop("songs")
        collection = SongCollection.objects.create(**validated_data)
        # TODO: add err handling
        for song in songs:
            song = BaseSong.objects.get(uuid=song)
            SongCollectionSong.objects.create(song=song, song_collection=collection)
        for i, author in enumerate(authors):
            author = StreamingUser.objects.get(uuid=author)
            SongCollectionAuthor.objects.create(
                author=author, song_collection=collection, author_priority=i
            )
        return collection
