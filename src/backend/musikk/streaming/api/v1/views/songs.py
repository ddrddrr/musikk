import logging
import tempfile

from rest_framework import status
from rest_framework.generics import get_object_or_404, RetrieveAPIView
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework.views import APIView

from streaming.models.profile import StreamingProfile
from streaming.permissions import IsPublicOrCollectionAuthor
from users.permissions import IsArtist
from websockets.event_helpers import send_ws_event
from streaming.api.v1.serializers.songs import (
    BaseSongCreateSerializer,
    CollectionSongGetSerializer,
)
from streaming.audio.tasks import convert_audio
from streaming.audio.validators import validate_audio
from streaming.models.songs import CollectionSong

logger = logging.getLogger(__name__)


class CollectionSongRetrieveView(RetrieveAPIView):
    permission_classes = [IsPublicOrCollectionAuthor]
    queryset = CollectionSong.objects.all()
    serializer_class = CollectionSongGetSerializer
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
            event_handler="base.event",
            event_name="invalidate.query",
            query_key=["queue"],
        )
        send_ws_event(
            f"user_{self.request.user.uuid}",
            event_handler="base.event",
            event_name="invalidate.query",
            query_key=["openCollection"],
        )
        send_ws_event(
            f"user_{self.request.user.uuid}",
            event_handler="base.event",
            event_name="invalidate.query",
            query_key=["friend-activity", "listening", self.request.user.uuid],
        )
        return Response(status=status.HTTP_204_NO_CONTENT)


# TODO: make client write to a url first and only then POST here
# get/stream the file here
class SongCreateView(APIView):
    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [IsArtist]

    def post(self, request, *args, **kwargs):
        user = self.request.user
        audio = request.FILES["audio"]
        validate_audio(audio)

        serializer = BaseSongCreateSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        instance = serializer.save()

        with tempfile.NamedTemporaryFile(delete=False) as tmp:
            for chunk in audio.chunks():
                tmp.write(chunk)
            temp_path = tmp.name

        convert_audio.apply_async(
            kwargs={
                "file_path": temp_path,
                "song_uuid": str(instance.uuid),
                "initiator_uuid": str(user.uuid),
            }
        )
        return Response(
            data={"uuid": str(instance.uuid)}, status=status.HTTP_202_ACCEPTED
        )
