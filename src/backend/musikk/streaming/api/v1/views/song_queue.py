from django.db import transaction
from rest_framework import status
from rest_framework.generics import RetrieveAPIView, get_object_or_404
from rest_framework.request import Request
from rest_framework.views import APIView
from rest_framework.response import Response

from streaming.api.v1.serializers.song_queue import SongQueueSerializer
from streaming.models import SongQueue, QueueItem, Collection
from streaming.models.songs import CollectionSong
from streaming.api.v1.ws_conf import ServerEvent
from streaming.permissions import IsPublicOrCollectionAuthor
from streaming.managers.playback_manager import PlaybackManager
from websockets.event_helpers import send_ws_event, user_group


class SongQueueMixin(APIView):
    def get_song_queue(self, request: Request) -> SongQueue:
        return request.user.streamingprofile.song_queue

    def _broadcast_queue_invalidation(self, request: Request) -> None:
        send_ws_event(
            user_group(request.user.uuid),
            ServerEvent.QUEUE_CHANGED,
        )

    # TODO: will be used in the playback views
    # def _stop_playback_and_broadcast(self, request: Request) -> None:
    #     playback_manager = PlaybackManager(user_uuid=str(request.user.uuid))
    #     playback_manager.stop()
    #     self._broadcast_playback_state(request)

    def _broadcast_playback_state(self, request: Request) -> None:
        playback_manager = PlaybackManager(user_uuid=str(request.user.uuid))
        send_ws_event(
            user_group(request.user.uuid),
            ServerEvent.PLAYBACK_CHANGE,
            playback=playback_manager.is_playback_active(),
        )


class SongQueueRetrieveView(SongQueueMixin, RetrieveAPIView):
    serializer_class = SongQueueSerializer

    def get_object(self):
        return self.get_song_queue(self.request)


class SongQueueAddSongView(SongQueueMixin):
    permission_classes = [IsPublicOrCollectionAuthor]

    def post(self, request, *args, **kwargs):
        song = get_object_or_404(CollectionSong, uuid=kwargs["uuid"])
        self.check_object_permissions(request, song)

        self.get_song_queue(request).insert(song)
        self._broadcast_queue_invalidation(request)
        return Response(status=status.HTTP_204_NO_CONTENT)


class SongQueueAddCollectionView(SongQueueMixin):
    permission_classes = [IsPublicOrCollectionAuthor]

    def post(self, request, *args, **kwargs):
        collection = get_object_or_404(Collection, uuid=kwargs["uuid"])
        self.check_object_permissions(request, collection)

        self.get_song_queue(request).insert(collection)
        self._broadcast_queue_invalidation(request)
        return Response(status=status.HTTP_204_NO_CONTENT)


class SongQueuePlaySongView(SongQueueMixin):
    permission_classes = [IsPublicOrCollectionAuthor]

    def post(self, request, *args, **kwargs):
        song = get_object_or_404(CollectionSong, uuid=kwargs["uuid"])
        self.check_object_permissions(request, song)

        self.get_song_queue(request).play_song(song)
        self._broadcast_queue_invalidation(request)
        return Response(status=status.HTTP_204_NO_CONTENT)


class SongQueuePlayCollectionView(SongQueueMixin):
    permission_classes = [IsPublicOrCollectionAuthor]

    def post(self, request, *args, **kwargs):
        collection = get_object_or_404(Collection, uuid=kwargs["uuid"])
        self.check_object_permissions(request, collection)

        self.get_song_queue(request).play_collection(collection)
        self._broadcast_queue_invalidation(request)
        return Response(status=status.HTTP_204_NO_CONTENT)


# TODO
class SongQueueAppendRandomSongsView(SongQueueMixin):
    def post(self, request, *args, **kwargs):
        return Response(status=status.HTTP_501_NOT_IMPLEMENTED)


class SongQueueRemoveItemView(SongQueueMixin):
    def post(self, request, *args, **kwargs):
        song_queue = self.get_song_queue(request)
        item = get_object_or_404(QueueItem, uuid=kwargs["uuid"])

        if song_queue != item.queue:
            return Response(
                status=status.HTTP_403_FORBIDDEN,
                data={"error": "Item does not belong to this user's queue."},
            )

        song_queue.remove(item)
        self._broadcast_queue_invalidation(request)
        return Response(status=status.HTTP_200_OK)


class SongQueueClearView(SongQueueMixin):
    def post(self, request, *args, **kwargs):
        with transaction.atomic():
            self.get_song_queue(request).clear()

        self._broadcast_queue_invalidation(request)
        return Response(status=status.HTTP_204_NO_CONTENT)


class SongQueueNextView(SongQueueMixin):
    def post(self, request, *args, **kwargs):
        song_queue = self.get_song_queue(request)
        if song_queue.is_empty():
            return Response(status=status.HTTP_204_NO_CONTENT)

        if node_uuid := kwargs.get("uuid"):
            item = get_object_or_404(QueueItem, uuid=node_uuid)
            song_queue.choose_queue_song(item)
        else:
            song_queue.advance()

        self._broadcast_queue_invalidation(request)
        return Response(status=status.HTTP_204_NO_CONTENT)


class SongQueuePrevView(SongQueueMixin):
    def post(self, request, *args, **kwargs):
        song_queue = self.get_song_queue(request)
        if song_queue.is_empty():
            return Response(status=status.HTTP_204_NO_CONTENT)

        song_queue.prev()
        self._broadcast_queue_invalidation(request)
        return Response(status=status.HTTP_204_NO_CONTENT)


class SongQueueReorderView(SongQueueMixin):
    def post(self, request, *args, **kwargs):
        song_queue = self.get_song_queue(request)

        item_uuid = request.data.get("item")
        before_uuid = request.data.get("before")
        after_uuid = request.data.get("after")

        if not item_uuid:
            return Response(
                status=status.HTTP_400_BAD_REQUEST,
                data={"error": "'item' is required."},
            )
        if not before_uuid and not after_uuid:
            return Response(
                status=status.HTTP_400_BAD_REQUEST,
                data={"error": "At least one of 'before' or 'after' is required."},
            )

        item = get_object_or_404(QueueItem, uuid=item_uuid)
        if item.queue != song_queue:
            return Response(
                status=status.HTTP_403_FORBIDDEN,
                data={"error": "Item does not belong to this user's queue."},
            )

        before = get_object_or_404(QueueItem, uuid=before_uuid) if before_uuid else None
        after = get_object_or_404(QueueItem, uuid=after_uuid) if after_uuid else None

        song_queue.reorder(item, before=before, after=after)
        self._broadcast_queue_invalidation(request)
        return Response(status=status.HTTP_204_NO_CONTENT)
