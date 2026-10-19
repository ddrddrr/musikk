from rest_framework import status
from rest_framework.generics import RetrieveAPIView, get_object_or_404
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from streaming.api.v1.serializers.song_queue import StoredPlaybackStateSerializer
from streaming.models import Collection, PlaybackQueue, QueueItem, StoredPlaybackState
from streaming.models.songs import CollectionSong
from streaming.permissions import IsPublicOrCollectionAuthor
from streaming.ws.player_controller import PlayerController


class PlayerMixin(APIView):
    def get_stored_playback_state(self, request: Request) -> StoredPlaybackState:
        return request.user.streamingprofile.stored_playback_state

    def get_playback_queue(self, request: Request) -> PlaybackQueue:
        return request.user.streamingprofile.stored_playback_state.playback_queue

    def get_controller(self, request: Request) -> PlayerController:
        return PlayerController(user_uuid=str(request.user.uuid))


class StoredPlaybackStateRetrieveView(PlayerMixin, RetrieveAPIView):
    serializer_class = StoredPlaybackStateSerializer

    def get_object(self):
        return self.get_stored_playback_state(self.request)


class QueueAddSongView(PlayerMixin):
    permission_classes = [IsPublicOrCollectionAuthor]

    def post(self, request, *args, **kwargs):
        song = get_object_or_404(CollectionSong, uuid=kwargs["uuid"])
        self.check_object_permissions(request, song)

        self.get_controller(request).add_song_to_queue(song)
        return Response(status=status.HTTP_204_NO_CONTENT)


class QueueAddCollectionView(PlayerMixin):
    permission_classes = [IsPublicOrCollectionAuthor]

    def post(self, request, *args, **kwargs):
        collection = get_object_or_404(Collection, uuid=kwargs["uuid"])
        self.check_object_permissions(request, collection)

        self.get_controller(request).add_collection_to_queue(collection)
        return Response(status=status.HTTP_204_NO_CONTENT)


class PlayerPlaySongView(PlayerMixin):
    permission_classes = [IsPublicOrCollectionAuthor]

    def post(self, request, *args, **kwargs):
        song = get_object_or_404(CollectionSong, uuid=kwargs["uuid"])
        self.check_object_permissions(request, song)

        self.get_controller(request).play_song(song)
        return Response(status=status.HTTP_204_NO_CONTENT)


class PlayerPlayCollectionView(PlayerMixin):
    permission_classes = [IsPublicOrCollectionAuthor]

    def post(self, request, *args, **kwargs):
        collection = get_object_or_404(Collection, uuid=kwargs["uuid"])
        self.check_object_permissions(request, collection)

        self.get_controller(request).play_collection(collection)
        return Response(status=status.HTTP_204_NO_CONTENT)


# TODO
class QueueAppendRandomSongsView(PlayerMixin):
    def post(self, request, *args, **kwargs):
        return Response(status=status.HTTP_501_NOT_IMPLEMENTED)


class QueueRemoveItemView(PlayerMixin):
    def post(self, request, *args, **kwargs):
        item = get_object_or_404(QueueItem, uuid=kwargs["uuid"])

        if self.get_playback_queue(request) != item.queue:
            return Response(
                status=status.HTTP_403_FORBIDDEN,
                data={"error": "Item does not belong to this user's queue."},
            )

        self.get_controller(request).remove_queue_item(item)
        return Response(status=status.HTTP_200_OK)


class PlayerClearView(PlayerMixin):
    def post(self, request, *args, **kwargs):
        self.get_controller(request).clear()
        return Response(status=status.HTTP_204_NO_CONTENT)


class PlayerNextView(PlayerMixin):
    def post(self, request, *args, **kwargs):
        controller = self.get_controller(request)

        if node_uuid := kwargs.get("uuid"):
            item = get_object_or_404(QueueItem, uuid=node_uuid)
            if item.queue != self.get_playback_queue(request):
                return Response(
                    status=status.HTTP_403_FORBIDDEN,
                    data={"error": "Item does not belong to this user's queue."},
                )
            controller.choose_queue_song(item)
        else:
            controller.advance()

        return Response(status=status.HTTP_204_NO_CONTENT)


class PlayerPrevView(PlayerMixin):
    def post(self, request, *args, **kwargs):
        self.get_controller(request).prev()
        return Response(status=status.HTTP_204_NO_CONTENT)
