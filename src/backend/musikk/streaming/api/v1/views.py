from rest_framework.views import APIView
from rest_framework.generics import ListAPIView, RetrieveAPIView
from rest_framework.response import Response
from rest_framework import status


from streaming.api.v1.serializers import (
    SongSerializer,
    SongCollectionSerializerBasic,
    SongQueueSerializer,
)
from streaming.song_collections import SongCollection
from streaming.song_queue import SongQueue
from streaming.songs import BaseSong


class SongListView(ListAPIView):
    queryset = BaseSong.objects.all()
    serializer_class = SongSerializer


class SongCollectionListView(ListAPIView):
    queryset = SongCollection.objects.all()
    serializer_class = SongCollectionSerializerBasic


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
