from functools import partial

from rest_framework import status
from rest_framework.generics import RetrieveAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from sse.config import EventChannels
from sse.events import send_invalidate_event
from streaming.api.v1.serializers import SongQueueSerializer
from streaming.song_collections import SongCollection
from streaming.song_queue import SongQueue, SongQueueNode
from streaming.songs import BaseSong
from users.users_extended import StreamingUser


send_invalidate_event = partial(send_invalidate_event, query_key=["queue"])


class SongQueueBaseView(APIView):
    permission_classes = [IsAuthenticated]

    def get_song_queue(self, request: Request) -> SongQueue:
        user: StreamingUser = request.user.streaminguser
        return user.song_queue


class SongQueueRetrieveView(SongQueueBaseView, RetrieveAPIView):
    serializer_class = SongQueueSerializer

    def get_object(self):
        return self.get_song_queue(self.request)


class SongQueueAddSongView(SongQueueBaseView):
    def post(self, request, *args, **kwargs):
        song_queue = self.get_song_queue(request)
        song = BaseSong.objects.get(uuid=kwargs["uuid"])
        song_queue.add_song(song=song, action=SongQueue.AddAction.ADD)
        send_invalidate_event(EventChannels.user_events(self.request.user.uuid))

        return Response(status=status.HTTP_204_NO_CONTENT)


class SongQueueAddCollectionView(SongQueueBaseView):
    def post(self, request, *args, **kwargs):
        song_queue = self.get_song_queue(request)
        collection = SongCollection.objects.get(uuid=kwargs["uuid"])
        song_queue.add_collection(collection=collection, action=SongQueue.AddAction.ADD)
        send_invalidate_event(EventChannels.user_events(self.request.user.uuid))

        return Response(status=status.HTTP_204_NO_CONTENT)


class SongQueueSetSongHeadView(SongQueueBaseView):
    def post(self, request, *args, **kwargs):
        song_queue = self.get_song_queue(request)
        song = BaseSong.objects.get(uuid=kwargs["uuid"])
        song_queue.add_song(song=song, action=SongQueue.AddAction.CHANGE_HEAD)
        send_invalidate_event(EventChannels.user_events(self.request.user.uuid))

        return Response(status=status.HTTP_204_NO_CONTENT)


class SongQueueSetCollectionHeadView(SongQueueBaseView):
    def post(self, request, *args, **kwargs):
        song_queue = self.get_song_queue(request)
        collection = SongCollection.objects.get(uuid=kwargs["uuid"])
        song_queue.add_collection(
            collection=collection, action=SongQueue.AddAction.CHANGE_HEAD
        )
        send_invalidate_event(EventChannels.user_events(self.request.user.uuid))

        return Response(status=status.HTTP_204_NO_CONTENT)


class SongQueueAppendRandomSongsView(SongQueueBaseView):
    def post(self, request, *args, **kwargs):
        song_queue = self.get_song_queue(request)
        send_invalidate_event(EventChannels.user_events(self.request.user.uuid))

        return Response(
            data={"nodes": song_queue.append_random_songs()},
            status=status.HTTP_201_CREATED,
        )


class SongQueueRemoveNodeView(SongQueueBaseView):
    def post(self, request, *args, **kwargs):
        song_queue = self.get_song_queue(request)
        node = SongQueueNode.objects.get(uuid=kwargs["uuid"])
        if song_queue is node.song_queue:
            node.delete()
            send_invalidate_event(EventChannels.user_events(self.request.user.uuid))

            return Response(status=status.HTTP_200_OK)
        return Response(
            status=status.HTTP_403_FORBIDDEN,
            data={"error": "Node does not belong to this user's queue."},
        )


class SongQueueClearView(SongQueueBaseView):
    def post(self, request, *args, **kwargs):
        song_queue = self.get_song_queue(request)
        song_queue.clear()
        send_invalidate_event(EventChannels.user_events(self.request.user.uuid))

        return Response(status=status.HTTP_204_NO_CONTENT)


class SongQueueShiftHeadView(SongQueueBaseView):
    def post(self, request, *args, **kwargs):
        song_queue = self.get_song_queue(request)
        if not song_queue.is_empty():
            shift_to_node = song_queue.head.next
            if node_uuid := kwargs.get("uuid"):
                shift_to_node = SongQueueNode.objects.filter(uuid=node_uuid).first()
            song_queue.shift_head_forward(to=shift_to_node)
            send_invalidate_event(EventChannels.user_events(self.request.user.uuid))

        return Response(status=status.HTTP_204_NO_CONTENT)


class SongQueueShiftHeadBackwardsView(SongQueueBaseView):
    def post(self, request, *args, **kwargs):
        song_queue = self.get_song_queue(request)
        if not song_queue.is_empty():
            song_queue.shift_head_backwards()
            send_invalidate_event(EventChannels.user_events(self.request.user.uuid))
        return Response(status=status.HTTP_204_NO_CONTENT)
