from django.contrib.postgres.search import TrigramSimilarity
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from streaming.api.v1.serializers import (
    BaseSongSerializer,
    SongCollectionSerializerBasic,
)
from streaming.models import BaseSong, SongCollection
from users.api.v1.serializers import BaseUserSerializer
from users.models import BaseUser

TRIGRAM_SIMILARITY_THRESHOLD = 0.3
MAX_RES_COUNT = 10


def search_objects(model, query, field_name):
    return (
        model.objects.annotate(similarity=TrigramSimilarity(field_name, query))
        .filter(similarity__gt=TRIGRAM_SIMILARITY_THRESHOLD)
        .order_by("-similarity")[:MAX_RES_COUNT]
    )


class SearchView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        query = request.query_params.get("q", "")
        if not query:
            return Response(status=status.HTTP_204_NO_CONTENT)

        songs = search_objects(BaseSong, query, "title")
        collections = search_objects(SongCollection, query, "title")
        users = search_objects(BaseUser, query, "display_name")

        songs_data = BaseSongSerializer(songs, many=True).data
        collections_data = SongCollectionSerializerBasic(collections, many=True).data
        users_data = BaseUserSerializer(users, many=True).data if users else []

        return Response(
            status=status.HTTP_200_OK,
            data={
                "songs": songs_data,
                "collections": collections_data,
                "users": users_data,
            },
        )
