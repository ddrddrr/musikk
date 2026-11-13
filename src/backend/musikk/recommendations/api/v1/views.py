from django.contrib.postgres.search import TrigramSimilarity
from drf_spectacular.utils import OpenApiParameter, extend_schema, inline_serializer
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from streaming.api.v1.serializers.collections import CollectionSerializerBasic
from streaming.api.v1.serializers.songs import CollectionSongRetrieveSerializer
from streaming.models import BaseSong, Collection
from streaming.models.songs import CollectionSong
from users.api.v1.serializers import BaseUserSerializer
from users.models import BaseUser, UserRole

TRIGRAM_SIMILARITY_THRESHOLD = 0.3
MAX_RESULTS = 10


class SearchView(APIView):
    @extend_schema(
        parameters=[OpenApiParameter("q", str, required=True)],
        responses={
            200: inline_serializer(
                name="SearchResults",
                fields={
                    "songs": CollectionSongRetrieveSerializer(many=True),
                    "albums": CollectionSerializerBasic(many=True),
                    "playlists": CollectionSerializerBasic(many=True),
                    "users": BaseUserSerializer(many=True),
                    "artists": BaseUserSerializer(many=True),
                },
            ),
            204: None,
        },
    )
    def get(self, request, *args, **kwargs):
        query = request.query_params.get("q", "").strip()
        if not query:
            return Response(status=status.HTTP_204_NO_CONTENT)

        data = {
            "songs": self._songs(query),
            "albums": self.search(
                Collection.objects.albums().public().published(),
                query,
                "title",
                CollectionSerializerBasic,
            ),
            "playlists": self.search(
                Collection.objects.playlists().public().published(),
                query,
                "title",
                CollectionSerializerBasic,
            ),
            "users": self.search(
                BaseUser.objects.filter(role=UserRole.BASE),
                query,
                "display_name",
                BaseUserSerializer,
            ),
            "artists": self.search(
                BaseUser.objects.filter(role=UserRole.ARTIST),
                query,
                "display_name",
                BaseUserSerializer,
            ),
        }

        return Response(data=data, status=status.HTTP_200_OK)

    def search(self, queryset, query, field_name, serializer_class) -> list:
        qs = (
            queryset.annotate(similarity=TrigramSimilarity(field_name, query))
            .filter(similarity__gt=TRIGRAM_SIMILARITY_THRESHOLD)
            .order_by("-similarity")[:MAX_RESULTS]
        )

        return serializer_class(qs, many=True, context={"request": self.request}).data

    def _songs(self, query):
        matching_songs = (
            BaseSong.objects.published()
            .in_public_published_album()
            .annotate(similarity=TrigramSimilarity("title", query))
            .filter(similarity__gt=TRIGRAM_SIMILARITY_THRESHOLD)
            .order_by("-similarity")[:MAX_RESULTS]
        )

        sc_songs = CollectionSong.objects.filter(
            collection__in=Collection.objects.albums().public().published(),
            song__in=matching_songs,
        )

        return CollectionSongRetrieveSerializer(
            sc_songs, many=True, context={"request": self.request}
        ).data
