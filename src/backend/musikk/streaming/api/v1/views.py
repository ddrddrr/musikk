from rest_framework.views import APIView
from rest_framework.mixins import CreateModelMixin, ListModelMixin
from rest_framework.generics import ListAPIView, GenericAPIView, RetrieveAPIView
from rest_framework.response import Response
from rest_framework import status

from streaming.api.v1.serializers import (
    SongSerializer,
    SongCollectionSerializerBasic,
    SongQueueSerializer,
    SongCollectionSerializerDetailed,
)
from streaming.song_collections import SongCollection
from streaming.song_queue import SongQueue
from streaming.songs import BaseSong
from users.users_extended import StreamingUser, ContentOwner


class SongListCreateView(ListModelMixin, CreateModelMixin, GenericAPIView):
    queryset = BaseSong.objects.all()
    serializer_class = SongSerializer

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
    queryset = SongCollection.objects.all()
    serializer_class = SongCollectionSerializerBasic


class SongCollectionDetailView(RetrieveAPIView):
    lookup_field = "uuid"
    queryset = SongCollection.objects.all()
    serializer_class = SongCollectionSerializerDetailed


class SongQueueRetrieveView(RetrieveAPIView):
    queryset = SongQueue.objects.all()
    serializer_class = SongQueueSerializer

    def get_object(self):
        return self.request.user.song_queue


class SongQueueAddSongView(APIView):
    def post(self, request, *args, **kwargs):
        song_queue: SongQueue = request.user.song_queue
        song = BaseSong.objects.get(request.data["uuid"])
        song_queue.add_song(song, to_end=False)
        return Response(status=status.HTTP_204_NO_CONTENT)


class SongQueueAddCollectionView(APIView):
    def post(self, request, *args, **kwargs):
        song_queue: SongQueue = request.user.song_queue
        collection = SongCollection.objects.get(request.data["uuid"])
        song_queue.add_collection_songs(collection, to_end=False)
        return Response(status=status.HTTP_204_NO_CONTENT)


class SongQueueAppendRandomView(APIView):
    def get(self):
        song_queue: SongQueue = self.request.user.song_queue
        return Response(
            data={"nodes": song_queue.append_random_songs()},
            status=status.HTTP_201_CREATED,
        )
