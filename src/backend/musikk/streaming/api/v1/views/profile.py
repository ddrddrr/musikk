from drf_spectacular.utils import extend_schema, inline_serializer
from rest_framework import serializers
from rest_framework.generics import RetrieveAPIView
from rest_framework.response import Response
from rest_framework.views import APIView

from streaming.api.v1.serializers.profile import StreamingProfileGetSerializer
from streaming.models import StreamingProfile


class StreamingProfileRetrieveView(RetrieveAPIView):
    serializer_class = StreamingProfileGetSerializer
    queryset = StreamingProfile.objects.all()

    def get_object(self):
        return self.request.user.streamingprofile


class MeLikedSongsView(APIView):
    @extend_schema(
        responses=inline_serializer(
            name="MeLikedSongs",
            fields={"song_uuids": serializers.ListField(child=serializers.UUIDField())},
        )
    )
    def get(self, request):
        uuids = request.user.streamingprofile.liked_songs.base_songs.values_list(
            "uuid", flat=True
        )
        return Response({"song_uuids": [str(u) for u in uuids]})


class MeLikedCollectionsView(APIView):
    @extend_schema(
        responses=inline_serializer(
            name="MeLikedCollections",
            fields={
                "collection_uuids": serializers.ListField(child=serializers.UUIDField())
            },
        )
    )
    def get(self, request):
        uuids = request.user.streamingprofile.liked_collections.values_list(
            "uuid", flat=True
        )
        return Response({"collection_uuids": [str(u) for u in uuids]})
