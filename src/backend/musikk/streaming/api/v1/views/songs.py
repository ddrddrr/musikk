import logging

from rest_framework import status
from rest_framework.generics import get_object_or_404, RetrieveAPIView
from rest_framework.response import Response
from rest_framework.views import APIView

from streaming.managers.upload_manager import UploadManager
from streaming.models.profile import StreamingProfile
from streaming.permissions import IsPublicOrCollectionAuthor
from users.permissions import IsArtist
from websockets.event_helpers import send_ws_event
from streaming.api.v1.serializers.songs import CollectionSongRetrieveSerializer
from streaming.models.songs import CollectionSong

logger = logging.getLogger(__name__)


class CollectionSongRetrieveView(RetrieveAPIView):
    permission_classes = [IsPublicOrCollectionAuthor]
    queryset = CollectionSong.objects.all()
    serializer_class = CollectionSongRetrieveSerializer
    lookup_field = "uuid"


class SongAddLikedView(APIView):
    permission_classes = [IsPublicOrCollectionAuthor]

    def post(self, *args, **kwargs):
        profile: StreamingProfile = self.request.user.streamingprofile

        scs_uuid = kwargs["uuid"]
        scs = get_object_or_404(CollectionSong, uuid=scs_uuid)
        self.check_object_permissions(self.request, scs)
        CollectionSong.objects.create(song=scs.song, collection=profile.liked_songs)

        # doing a refetch for the queue is easier than traversing nodes and checking,
        # whether the song is in the queue
        send_ws_event(
            f"user_{self.request.user.uuid}",
            event_name="invalidate.query",
            query_key=["queue"],
        )
        send_ws_event(
            f"user_{self.request.user.uuid}",
            event_name="invalidate.query",
            query_key=["openCollection"],
        )
        send_ws_event(
            f"user_{self.request.user.uuid}",
            event_name="invalidate.query",
            query_key=["friend-activity", "listening", self.request.user.uuid],
        )
        return Response(status=status.HTTP_204_NO_CONTENT)




class SongUploadStatusView(APIView):
    permission_classes = [IsArtist]

    def get(self, request, song_uuid: str):
        um = UploadManager(song_uuid)
        return Response({"uuid": song_uuid, "status": um.get_status() or "unknown"})
