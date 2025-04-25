from rest_framework.mixins import CreateModelMixin, ListModelMixin
from rest_framework.generics import (
    ListAPIView,
    GenericAPIView,
    RetrieveAPIView,
)
from rest_framework.permissions import IsAuthenticated

from streaming.api.v1.serializers import (
    BaseSongSerializer,
    SongCollectionSerializerBasic,
    SongCollectionSerializerDetailed,
)
from streaming.song_collections import SongCollection
from streaming.songs import BaseSong
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


# TODO: streams will be needed for statistics, not for history
# class StreamCreateView(CreateAPIView):
#     permission_classes = [IsAuthenticated]
#     queryset =
