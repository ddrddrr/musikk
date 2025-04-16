from rest_framework.views import APIView
from rest_framework.mixins import CreateModelMixin, ListModelMixin
from rest_framework.generics import ListAPIView, GenericAPIView, RetrieveAPIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from streaming.api.v1.serializers import (
    SongSerializer,
    SongCollectionSerializerBasic,
    SongQueueSerializer,
    SongCollectionSerializerDetailed,
)
from streaming.song_collections import SongCollection
from streaming.song_queue import SongQueue, SongQueueNode
from streaming.songs import BaseSong
from users.user_base import BaseUser
from users.users_extended import StreamingUser, ContentOwner


class SongListCreateView(ListModelMixin, CreateModelMixin, GenericAPIView):
    permission_classes = [IsAuthenticated]
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
    permission_classes = [IsAuthenticated]
    queryset = SongCollection.objects.all()
    serializer_class = SongCollectionSerializerBasic


class SongCollectionDetailView(RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    lookup_field = "uuid"
    queryset = SongCollection.objects.all()
    serializer_class = SongCollectionSerializerDetailed


class SongQueueRetrieveView(RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    queryset = SongQueue.objects.all()
    serializer_class = SongQueueSerializer

    def get_object(self):
        user: StreamingUser = self.request.user.streaminguser
        return user.song_queue


class SongQueueAddSongView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        user: StreamingUser = request.user.streaminguser
        song_queue: SongQueue = user.song_queue
        song = BaseSong.objects.get(uuid=kwargs["uuid"])
        song_queue.add_song(song=song, action=SongQueue.AddAction.ADD)
        return Response(status=status.HTTP_204_NO_CONTENT)


class SongQueueAddCollectionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        user: StreamingUser = request.user.streaminguser
        song_queue: SongQueue = user.song_queue
        collection = SongCollection.objects.get(uuid=kwargs["uuid"])
        song_queue.add_collection(collection=collection, action=SongQueue.AddAction.ADD)
        return Response(status=status.HTTP_204_NO_CONTENT)


class SongQueueSetSongHeadView(APIView):
    """Changes the current head to the provided song"""

    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        user: StreamingUser = request.user.streaminguser
        song_queue: SongQueue = user.song_queue
        song = BaseSong.objects.get(uuid=kwargs["uuid"])
        song_queue.add_song(song=song, action=SongQueue.AddAction.CHANGE_HEAD)
        return Response(status=status.HTTP_204_NO_CONTENT)


class SongQueueSetCollectionHeadView(APIView):
    """Changes the current head to the provided song"""

    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        user: StreamingUser = request.user.streaminguser
        song_queue: SongQueue = user.song_queue
        collection = SongCollection.objects.get(uuid=kwargs["uuid"])
        song_queue.add_collection(
            collection=collection, action=SongQueue.AddAction.CHANGE_HEAD
        )
        return Response(status=status.HTTP_204_NO_CONTENT)


class SongQueueAppendRandomSongsView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        user: StreamingUser = request.user.streaminguser
        song_queue: SongQueue = user.song_queue
        return Response(
            data={"nodes": song_queue.append_random_songs()},
            status=status.HTTP_201_CREATED,
        )


class SongQueueRemoveNodeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        user: StreamingUser = request.user.streaminguser
        node = SongQueueNode.objects.get(uuid=kwargs["uuid"])
        if user.song_queue is node.song_queue:
            node.delete()
            return Response(
                status=status.HTTP_200_OK,
            )
        return Response(
            status=status.HTTP_403_FORBIDDEN,
            data={"error": "Node does not belong to this user's queue."},
        )
