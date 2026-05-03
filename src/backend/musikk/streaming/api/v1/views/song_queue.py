from rest_framework import status
from rest_framework.generics import RetrieveAPIView, get_object_or_404
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView
from websockets.event_helpers import send_ws_event, user_group

from streaming.api.v1.serializers.song_queue import PlayerStateSerializer
from streaming.events import ServerEvent
from streaming.managers.playback_manager import PlaybackManager
from streaming.models import Collection, PlayerState, QueueItem, SongQueue
from streaming.models.songs import CollectionSong
from streaming.permissions import IsPublicOrCollectionAuthor
from streaming.state_broadcasters.playback import PlaybackStateBroadcaster
from streaming.state_broadcasters.player import PlayerStateBroadcaster


class PlayerMixin(APIView):
    def get_player(self, request: Request) -> PlayerState:
        return request.user.streamingprofile.player

    def get_song_queue(self, request: Request) -> SongQueue:
        return request.user.streamingprofile.player.queue

    def _broadcast_queue_invalidation(self, request: Request) -> None:
        send_ws_event(
            user_group(request.user.uuid),
            ServerEvent.QUEUE_CHANGED,
        )

    def _clear_playback_position(self, request: Request) -> None:
        PlaybackManager(user_uuid=str(request.user.uuid)).clear_position()

    def _stop_playback(self, request: Request) -> None:
        PlaybackStateBroadcaster(user_uuid=str(request.user.uuid)).stop()

    def _broadcast_player_state(self, request: Request) -> None:
        PlayerStateBroadcaster(user_uuid=str(request.user.uuid)).broadcast_state()


class PlayerStateRetrieveView(PlayerMixin, RetrieveAPIView):
    serializer_class = PlayerStateSerializer

    def get_object(self):
        return self.get_player(self.request)


class QueueAddSongView(PlayerMixin):
    permission_classes = [IsPublicOrCollectionAuthor]

    def post(self, request, *args, **kwargs):
        song = get_object_or_404(CollectionSong, uuid=kwargs["uuid"])
        self.check_object_permissions(request, song)

        self.get_song_queue(request).insert(song)
        self._broadcast_queue_invalidation(request)
        return Response(status=status.HTTP_204_NO_CONTENT)


class QueueAddCollectionView(PlayerMixin):
    permission_classes = [IsPublicOrCollectionAuthor]

    def post(self, request, *args, **kwargs):
        collection = get_object_or_404(Collection, uuid=kwargs["uuid"])
        self.check_object_permissions(request, collection)

        self.get_song_queue(request).insert(collection)
        self._broadcast_queue_invalidation(request)
        return Response(status=status.HTTP_204_NO_CONTENT)


class PlayerPlaySongView(PlayerMixin):
    permission_classes = [IsPublicOrCollectionAuthor]

    def post(self, request, *args, **kwargs):
        song = get_object_or_404(CollectionSong, uuid=kwargs["uuid"])
        self.check_object_permissions(request, song)

        self.get_player(request).play_song(song)
        self._clear_playback_position(request)
        self._broadcast_queue_invalidation(request)
        self._broadcast_player_state(request)
        return Response(status=status.HTTP_204_NO_CONTENT)


class PlayerPlayCollectionView(PlayerMixin):
    permission_classes = [IsPublicOrCollectionAuthor]

    def post(self, request, *args, **kwargs):
        collection = get_object_or_404(Collection, uuid=kwargs["uuid"])
        self.check_object_permissions(request, collection)

        self.get_player(request).play_collection(collection)
        self._clear_playback_position(request)
        self._broadcast_queue_invalidation(request)
        self._broadcast_player_state(request)
        return Response(status=status.HTTP_204_NO_CONTENT)


# TODO
class QueueAppendRandomSongsView(PlayerMixin):
    def post(self, request, *args, **kwargs):
        return Response(status=status.HTTP_501_NOT_IMPLEMENTED)


class QueueRemoveItemView(PlayerMixin):
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


class PlayerClearView(PlayerMixin):
    def post(self, request, *args, **kwargs):
        self.get_player(request).clear()
        self._clear_playback_position(request)
        self._broadcast_queue_invalidation(request)
        self._broadcast_player_state(request)
        return Response(status=status.HTTP_204_NO_CONTENT)


class PlayerNextView(PlayerMixin):
    def post(self, request, *args, **kwargs):
        player = self.get_player(request)
        if player.is_empty():
            return Response(status=status.HTTP_204_NO_CONTENT)

        if node_uuid := kwargs.get("uuid"):
            item = get_object_or_404(QueueItem, uuid=node_uuid)
            if item.queue != player.queue:
                return Response(
                    status=status.HTTP_403_FORBIDDEN,
                    data={"error": "Item does not belong to this user's queue."},
                )
            player.choose_queue_song(item)
        else:
            # nothing left --> stop playback
            if player.advance() is None:
                self._stop_playback(request)
                self._clear_playback_position(request)
                self._broadcast_queue_invalidation(request)
                return Response(status=status.HTTP_204_NO_CONTENT)

        self._clear_playback_position(request)
        self._broadcast_queue_invalidation(request)
        self._broadcast_player_state(request)
        return Response(status=status.HTTP_204_NO_CONTENT)


class PlayerPrevView(PlayerMixin):
    def post(self, request, *args, **kwargs):
        player = self.get_player(request)
        if player.is_empty():
            return Response(status=status.HTTP_204_NO_CONTENT)

        player.prev()
        self._clear_playback_position(request)
        self._broadcast_queue_invalidation(request)
        self._broadcast_player_state(request)
        return Response(status=status.HTTP_204_NO_CONTENT)


class QueueReorderView(PlayerMixin):
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


class MoveContextToQueueView(PlayerMixin):
    def post(self, request, *args, **kwargs):
        player = self.get_player(request)

        cs_uuid = request.data.get("collection_song")
        before_uuid = request.data.get("before")
        after_uuid = request.data.get("after")

        if not cs_uuid:
            return Response(
                status=status.HTTP_400_BAD_REQUEST,
                data={"error": "'collection_song' is required."},
            )

        collection_song = get_object_or_404(CollectionSong, uuid=cs_uuid)

        before = get_object_or_404(QueueItem, uuid=before_uuid) if before_uuid else None
        after = get_object_or_404(QueueItem, uuid=after_uuid) if after_uuid else None

        from streaming.models.song_queue import POSITION_GAP

        if before and after:
            position = (before.position + after.position) / 2
        elif before:
            position = before.position + POSITION_GAP
        elif after:
            position = after.position - POSITION_GAP
        else:
            position = player.queue._calculate_append_position()
            player.queue.save()

        player.move_from_context_to_queue(collection_song, position)
        self._broadcast_queue_invalidation(request)
        return Response(status=status.HTTP_204_NO_CONTENT)
