from rest_framework.views import APIView
from rest_framework.generics import ListAPIView, RetrieveAPIView, CreateAPIView
from rest_framework.response import Response
from rest_framework import status

from audio_processing.ffmpeg_wrapper import FFMPEGWrapper, FlacOnly
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


class SongListView(ListAPIView):
    queryset = BaseSong.objects.all()
    serializer_class = SongSerializer


class SongCreateView(CreateAPIView):
    serializer_class = SongSerializer

    def perform_create(self, serializer):
        song = super().perform_create(serializer)
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


class SongQueueAppendRandomView(APIView):
    def get(self):
        song_queue: SongQueue = self.request.user.song_queue
        return Response(
            data={"nodes": song_queue.append_random_songs()},
            status=status.HTTP_201_CREATED,
        )
