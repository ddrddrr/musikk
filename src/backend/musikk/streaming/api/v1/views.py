from rest_framework.mixins import CreateModelMixin, ListModelMixin
from rest_framework.views import APIView
from rest_framework.generics import (
    ListAPIView,
    GenericAPIView,
    RetrieveAPIView,
)
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from streaming.api.v1.serializers import (
    BaseSongSerializer,
    SongCollectionSerializerBasic,
    SongCollectionSerializerDetailed,
)
from streaming.song_collections import SongCollection
from streaming.songs import BaseSong, SongCollectionSong
from users.users_extended import ContentOwner


class SongListCreateView(ListModelMixin, CreateModelMixin, GenericAPIView):
    permission_classes = [IsAuthenticated]
    queryset = BaseSong.objects.all()
    serializer_class = BaseSongSerializer

    def get(self, request, *args, **kwargs):
        return self.list(request, *args, **kwargs)

    def post(self, request, *args, **kwargs):
        return self.create(request, *args, **kwargs)

    def perform_create(self, serializer):
        song = serializer.save()
        if isinstance(self.request.user, ContentOwner):
            user: ContentOwner = self.request.user
            user.owned_songs.add(song)
            user.save()


class SongCollectionListView(ListAPIView):
    permission_classes = [IsAuthenticated]
    queryset = SongCollection.objects.all()
    serializer_class = SongCollectionSerializerBasic


class SongCollectionDetailView(RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    lookup_field = "uuid"
    queryset = SongCollection.objects.all()
    serializer_class = SongCollectionSerializerDetailed


class LikedSongsAddView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, *args, **kwargs):
        user = request.user.streaming_user
        song_uuid = request.data["uuid"]
        if not song_uuid or not (song := BaseSong.object.filter(uuid=song_uuid)):
            return Response(status=status.HTTP_400_BAD_REQUEST)

        SongCollectionSong.objects.create(song=song, song_collection=user.liked_songs)
        return Response(status=status.HTTP_204_NO_CONTENT)


# TODO: streams will be needed for statistics, not for history
# class StreamCreateView(CreateAPIView):
#     permission_classes = [IsAuthenticated]
#     queryset =
