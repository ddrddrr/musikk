from django.contrib.postgres.search import TrigramSimilarity
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from streaming.api.v1.serializers.songs import CollectionSongSerializer
from streaming.api.v1.serializers.collections import CollectionSerializerBasic
from streaming.models import BaseSong, Collection
from streaming.models.collections import CollectionType
from streaming.models.songs import CollectionSong
from users.api.v1.serializers import BaseUserSerializer
from users.models import BaseUser, UserRole

TRIGRAM_SIMILARITY_THRESHOLD = 0.3
MAX_RESULTS = 10


class SearchView(APIView):
    def get(self, request, *args, **kwargs):
        query = request.query_params.get("q", "").strip()
        if not query:
            return Response(status=status.HTTP_204_NO_CONTENT)

        data = {
            "songs": self._songs(query),
            "albums": self.search(
                Collection,
                query,
                "title",
                CollectionSerializerBasic,
                extra_filters={"type": "album", "private": False},
            ),
            "playlists": self.search(
                Collection,
                query,
                "title",
                CollectionSerializerBasic,
                extra_filters={"type": "playlist", "private": False},
            ),
            "users": self.search(
                BaseUser,
                query,
                "display_name",
                BaseUserSerializer,
                extra_filters={"role": UserRole.BASE},
            ),
            "artists": self.search(
                BaseUser,
                query,
                "display_name",
                BaseUserSerializer,
                extra_filters={"role": UserRole.ARTIST},
            ),
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

        sc_songs = CollectionSong.objects.filter(
            collection__type=CollectionType.ALBUM,
            collection__private=False,
            song__in=matching_songs,
        )

        return CollectionSongSerializer(
            sc_songs, many=True, context={"request": self.request}
        ).data
