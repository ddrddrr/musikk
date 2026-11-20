from django.contrib.postgres.search import TrigramSimilarity, TrigramWordSimilarity
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

# the default of pg_trgm.word_similarity_threshold. A single letter scores 0.5,
# so it finds nothing
SUBSTRING_SIMILARITY_THRESHOLD = 0.6
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
        qs = self._ranked(queryset, query, field_name)
        return serializer_class(qs, many=True, context={"request": self.request}).data

    def _songs(self, query):
        # ranks the album entries directly, because a second query for the entries
        # of the matching songs would sort them by their position in the album
        entries = CollectionSong.objects.filter(
            collection__in=Collection.objects.albums().public().published(),
            song__in=BaseSong.objects.published(),
        )
        qs = self._ranked(entries, query, "song__title")
        return CollectionSongRetrieveSerializer(
            qs, many=True, context={"request": self.request}
        ).data

    @staticmethod
    def _ranked(queryset, query, field_name):
        """
        Compares the query with the best matching part of the name, so the start of a
        word ("lov") finds a long name ("Love Me Tender"). Every name that contains the
        query gets the same score, so the similarity to the whole name sorts these
        names, and the names closest to the query come first.
        """
        return (
            queryset.annotate(
                substring_similarity=TrigramWordSimilarity(query, field_name),
                whole_name_similarity=TrigramSimilarity(field_name, query),
            )
            .filter(substring_similarity__gte=SUBSTRING_SIMILARITY_THRESHOLD)
            .order_by("-substring_similarity", "-whole_name_similarity")[:MAX_RESULTS]
        )
