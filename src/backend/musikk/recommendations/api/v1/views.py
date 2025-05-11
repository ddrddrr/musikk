from django.contrib.postgres.search import TrigramSimilarity
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from streaming.api.v1.serializers_song import (
    BaseSongSerializer,
    SongCollectionSongSerializer,
)
from streaming.api.v1.serializers_song_collection import SongCollectionSerializerBasic
from streaming.models import BaseSong, SongCollection
from streaming.songs import SongCollectionSong
from users.api.v1.serializers_base import BaseUserSerializer
from users.models import Artist, StreamingUser


TRIGRAM_SIMILARITY_THRESHOLD = 0.3
MAX_RESULTS = 10


class SearchView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        query = request.query_params.get("q", "").strip()
        if not query:
            return Response(status=status.HTTP_204_NO_CONTENT)

        data = {
            "songs": self._songs(query),
            "albums": self.search(
                SongCollection,
                query,
                "title",
                SongCollectionSerializerBasic,
                extra_filters={"type": "album"},
            ),
            "playlists": self.search(
                SongCollection,
                query,
                "title",
                SongCollectionSerializerBasic,
                extra_filters={"type": "playlist"},
            ),
            "users": self.search(
                StreamingUser,
                query,
                "display_name",
                BaseUserSerializer,
                extra_filters={"artist": None},  # users who are not artists
            ),
            "artists": self.search(Artist, query, "display_name", BaseUserSerializer),
        }

        return Response(data=data, status=status.HTTP_200_OK)

    def search(
        self, model, query, field_name, serializer_class, extra_filters=None
    ) -> list:
        qs = model.objects.annotate(similarity=TrigramSimilarity(field_name, query))

        if extra_filters:
            qs = qs.filter(**extra_filters)

        qs = qs.filter(similarity__gt=TRIGRAM_SIMILARITY_THRESHOLD).order_by(
            "-similarity"
        )[:MAX_RESULTS]

        return serializer_class(qs, many=True, context={"request": self.request}).data

    def _songs(self, query):
        matching_songs = (
            BaseSong.objects.annotate(similarity=TrigramSimilarity("title", query))
            .filter(similarity__gt=TRIGRAM_SIMILARITY_THRESHOLD)
            .order_by("-similarity")[:MAX_RESULTS]
        )

        sc_songs = SongCollectionSong.objects.filter(song__in=matching_songs)

        return SongCollectionSongSerializer(
            sc_songs, many=True, context={"request": self.request}
        ).data
