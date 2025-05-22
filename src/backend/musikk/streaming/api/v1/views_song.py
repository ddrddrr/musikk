import json
import logging

from rest_framework import status, serializers
from rest_framework.generics import get_object_or_404, RetrieveAPIView
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from sse.config import EventChannels
from sse.events import send_invalidate_event
from streaming.api.v1.serializers_song import (
    BaseSongCreateSerializer,
    SongCollectionSongSerializer,
)
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
        send_invalidate_event(EventChannels.user_events(user.uuid), ["queue"])
        send_invalidate_event(EventChannels.user_events(user.uuid), ["openCollection"])
        send_invalidate_event(
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
                data={"error": "Only Artists are allowed to create Songs"},
            )

        raw = request.data.get("info")
        if not raw:
            return Response(
                {"detail": "Missing info payload"}, status=status.HTTP_400_BAD_REQUEST
            )

        info = json.loads(raw)
        authors = info.get("authors")
        if not authors:
            authors = [str(request.user.streaminguser.uuid)]
        songs = info.get("songs", [])

        succeeded, failed = [], []

        for i, song in enumerate(songs):
            key = song.get("key")
            song_data = {
                "title": song["title"],
                "description": song.get("description", ""),
                "audio": request.FILES.get(f"{key}_audio"),
                "image": request.FILES.get(f"{key}_image"),
                "authors": authors,
            }
            serializer = BaseSongCreateSerializer(data=song_data)
            try:
                serializer.is_valid(raise_exception=True)
                instance = serializer.save()
                instance.draft = True  # handled when collection is created
                instance.save(update_fields=["draft"])
                succeeded.append({"uuid": str(instance.uuid), "key": key})
            except serializers.ValidationError as ex:
                failed.append({"key": key, "errors": ex.detail})
                logger.error(f"Validation error while creating song '{key}': {ex}")
            except Exception as ex:
                failed.append({"key": key, "errors": [str(ex)]})
                logger.error(f"Unexpected error while creating song '{key}': {ex}")

        if failed:
            response_status = status.HTTP_400_BAD_REQUEST
        else:
            response_status = status.HTTP_201_CREATED
        return Response(
            {"succeeded": succeeded, "failed": failed}, status=response_status
        )
