from rest_framework import status
from rest_framework.generics import RetrieveAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from streaming.api.v1.serializers import SongQueueSerializer
from streaming.song_collections import SongCollection
from streaming.song_queue import SongQueue, SongQueueNode
from streaming.songs import BaseSong
from users.users_extended import StreamingUser


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


class SongQueueClearView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        user: StreamingUser = request.user.streaminguser
        song_queue: SongQueue = user.song_queue
        song_queue.clear()
        return Response(status=status.HTTP_204_NO_CONTENT)


class SongQueueShiftHeadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        user: StreamingUser = request.user.streaminguser
        song_queue: SongQueue = user.song_queue
        if not song_queue.is_empty():
            shift_to_node = song_queue.head.next
            if node_uuid := kwargs.get("uuid"):
                shift_to_node = SongQueueNode.objects.filter(uuid=node_uuid)
            song_queue.shift_head_forward(to=shift_to_node)
        return Response(status=status.HTTP_204_NO_CONTENT)
