import logging
import tempfile

from rest_framework import status
from rest_framework.generics import get_object_or_404, RetrieveAPIView
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from sse.config import EventChannels
from sse.events import Event
from streaming.api.v1.serializers.serializers_song import (
    BaseSongCreateSerializer,
    SongCollectionSongSerializer,
)
from streaming.audio.tasks import convert_audio
from streaming.audio.validators import validate_audio
from streaming.songs import SongCollectionSong

logger = logging.getLogger(__name__)


class SongCollectionSongRetrieveView(RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    queryset = SongCollectionSong.objects.all()
    serializer_class = SongCollectionSongSerializer
    lookup_field = "uuid"


class SongAddLikedView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        user = request.user.streaminguser

        scs_uuid = kwargs["uuid"]
        scs = get_object_or_404(SongCollectionSong, uuid=scs_uuid)
        SongCollectionSong.objects.create(
            song=scs.song, song_collection=user.liked_songs
        )

        # doing a refetch for the queue is easier than traversing nodes and checking,
        # whether the song is in the queue
        Event.invalidate_event(EventChannels.user_events(user.uuid), ["queue"])
        Event.invalidate_event(EventChannels.user_events(user.uuid), ["openCollection"])
        Event.invalidate_event(
            EventChannels.user_events(user.uuid),
            ["friend-activity", "listening", user.uuid],
        )
        return Response(status=status.HTTP_204_NO_CONTENT)


class SongCreateView(APIView):
    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        user = getattr(request.user.streaminguser, "artist", None)
        if not user:
            return Response(
                status=status.HTTP_403_FORBIDDEN,
                data={"error": "Only Artists are allowed to create Songs."},
            )

        audio = request.FILES["audio"]
        validate_audio(audio)

        serializer = BaseSongCreateSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        instance = serializer.save()

        with tempfile.NamedTemporaryFile(delete=False) as tmp:
            for chunk in audio.chunks():
                tmp.write(chunk)
            temp_path = tmp.name

        # TODO: probably call only on commit
        convert_audio.apply_async(kwargs={
            "file_path": temp_path,
            "song_uuid": str(instance.uuid),
            "initiator_uuid": str(user.uuid),
        })
        return Response(
            data={"uuid": str(instance.uuid)}, status=status.HTTP_202_ACCEPTED
        )
