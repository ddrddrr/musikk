from django.db import transaction
from rest_framework import status
from rest_framework.generics import RetrieveAPIView, get_object_or_404
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from streaming.api.v1.serializers.song_queue import SongQueueSerializer
from streaming.models import SongQueue, SongQueueNode, Collection
from streaming.models.songs import CollectionSong
from streaming.permissions import IsPublicOrCollectionAuthor
from streaming.managers.playback_manager import PlaybackManager
from websockets.event_helpers import send_ws_event

# TODO LAST SONG IN THE QUEUE DOESNT PLAY??
class SongQueueBaseView(APIView):
    permission_classes = [IsAuthenticated]

    def get_song_queue(self, request: Request) -> SongQueue:
        return request.user.streamingprofile.song_queue

    def _user_group(self, request: Request) -> str:
        return f"user_{request.user.uuid}"

    def _invalidate_queue(self, request: Request) -> None:
        send_ws_event(
            self._user_group(request),
            "invalidate.query",
            query_key=["queue"],
        )

    def _stop_playback_and_broadcast(self, request: Request) -> None:
        playback_manager = PlaybackManager(user_uuid=str(request.user.uuid))
        playback_manager.stop()
        self._broadcast_playback_state(request)

    def _broadcast_playback_state(self, request: Request) -> None:
        playback_manager = PlaybackManager(user_uuid=str(request.user.uuid))
        send_ws_event(
            self._user_group(request),
            "playback.change",
            playback=playback_manager.is_playback_active(),
        )


class SongQueueRetrieveView(SongQueueBaseView, RetrieveAPIView):
    serializer_class = SongQueueSerializer

    def get_object(self):
        return self.get_song_queue(self.request)


class SongQueueAddSongView(SongQueueBaseView):
    permission_classes = [IsPublicOrCollectionAuthor]

    def post(self, request, *args, **kwargs):
        song = get_object_or_404(CollectionSong, uuid=kwargs["uuid"])
        self.check_object_permissions(request, song)

        self.get_song_queue(request).add_song(song=song, action=SongQueue.AddAction.ADD)
        self._invalidate_queue(request)
        return Response(status=status.HTTP_204_NO_CONTENT)


class SongQueueAddCollectionView(SongQueueBaseView):
    permission_classes = [IsPublicOrCollectionAuthor]

    def post(self, request, *args, **kwargs):
        collection = get_object_or_404(Collection, uuid=kwargs["uuid"])
        self.check_object_permissions(request, collection)

        self.get_song_queue(request).add_collection(
            collection=collection, action=SongQueue.AddAction.ADD
        )
        self._invalidate_queue(request)
        return Response(status=status.HTTP_204_NO_CONTENT)


class SongQueueSetSongHeadView(SongQueueBaseView):
    permission_classes = [IsPublicOrCollectionAuthor]

    def post(self, request, *args, **kwargs):
        song = get_object_or_404(CollectionSong, uuid=kwargs["uuid"])
        self.check_object_permissions(request, song)

        self.get_song_queue(request).add_song(
            song=song, action=SongQueue.AddAction.CHANGE_HEAD
        )
        self._invalidate_queue(request)
        return Response(status=status.HTTP_204_NO_CONTENT)


class SongQueueSetCollectionHeadView(SongQueueBaseView):
    permission_classes = [IsPublicOrCollectionAuthor]

    def post(self, request, *args, **kwargs):
        collection = get_object_or_404(Collection, uuid=kwargs["uuid"])
        self.check_object_permissions(request, collection)

        self.get_song_queue(request).add_collection(
            collection=collection, action=SongQueue.AddAction.CHANGE_HEAD
        )
        self._invalidate_queue(request)
        return Response(status=status.HTTP_204_NO_CONTENT)


# TODO
class SongQueueAppendRandomSongsView(SongQueueBaseView):
    def post(self, request, *args, **kwargs):
        self.get_song_queue(request).append_random_songs()
        self._invalidate_queue(request)
        return Response(status=status.HTTP_201_CREATED)


class SongQueueRemoveNodeView(SongQueueBaseView):
    def post(self, request, *args, **kwargs):
        song_queue = self.get_song_queue(request)
        node = get_object_or_404(SongQueueNode, uuid=kwargs["uuid"])

        if song_queue is not node.song_queue:
            return Response(
                status=status.HTTP_403_FORBIDDEN,
                data={"error": "Node does not belong to this user's queue."},
            )

        node.delete()
        self._invalidate_queue(request)
        if song_queue.is_empty():
            self._stop_playback_and_broadcast(request)

        return Response(status=status.HTTP_200_OK)


class SongQueueClearView(SongQueueBaseView):
    def post(self, request, *args, **kwargs):
        with transaction.atomic():
            self.get_song_queue(request).clear()

        self._stop_playback_and_broadcast(request)
        self._invalidate_queue(request)
        return Response(status=status.HTTP_204_NO_CONTENT)


class SongQueueShiftHeadView(SongQueueBaseView):
    def post(self, request, *args, **kwargs):
        song_queue = self.get_song_queue(request)
        if song_queue.is_empty():
            return Response(status=status.HTTP_204_NO_CONTENT)

        shift_to_node = None
        if node_uuid := kwargs.get("uuid"):
            shift_to_node = get_object_or_404(SongQueueNode, uuid=node_uuid)

        song_queue.shift_head_forward(to=shift_to_node)
        self._invalidate_queue(request)
        if song_queue.is_empty():
            self._stop_playback_and_broadcast(request)

        return Response(status=status.HTTP_204_NO_CONTENT)


class SongQueueShiftHeadBackwardsView(SongQueueBaseView):
    def post(self, request, *args, **kwargs):
        song_queue = self.get_song_queue(request)
        if song_queue.is_empty():
            return Response(status=status.HTTP_204_NO_CONTENT)

        song_queue.shift_head_backwards()
        self._invalidate_queue(request)
        return Response(status=status.HTTP_204_NO_CONTENT)
