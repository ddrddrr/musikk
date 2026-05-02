import logging

from rest_framework import status
from rest_framework.generics import RetrieveAPIView, get_object_or_404
from rest_framework.response import Response
from rest_framework.views import APIView
from users.permissions import IsArtist
from websockets.event_helpers import send_ws_event, user_group

from streaming.api.v1.serializers.songs import CollectionSongRetrieveSerializer
from streaming.events import ServerEvent
from streaming.managers.upload_manager import UploadManager
from streaming.models.profile import StreamingProfile
from streaming.models.songs import CollectionSong
from streaming.permissions import IsPublicOrCollectionAuthor

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
        group = user_group(self.request.user.uuid)
        send_ws_event(group, ServerEvent.QUEUE_CHANGED)
        send_ws_event(group, ServerEvent.COLLECTION_CHANGED)
        return Response(status=status.HTTP_204_NO_CONTENT)

    def delete(self, *args, **kwargs):
        profile: StreamingProfile = self.request.user.streamingprofile

        scs_uuid = kwargs["uuid"]
        scs = get_object_or_404(CollectionSong, uuid=scs_uuid)
        self.check_object_permissions(self.request, scs)
        CollectionSong.objects.filter(
            song=scs.song, collection=profile.liked_songs
        ).delete()

        group = user_group(self.request.user.uuid)
        send_ws_event(group, ServerEvent.QUEUE_CHANGED)
        send_ws_event(group, ServerEvent.COLLECTION_CHANGED)
        return Response(status=status.HTTP_204_NO_CONTENT)


class SongUploadStatusView(APIView):
    permission_classes = [IsArtist]

    # TODO: rewrite with operation id!
    def get(self, request, song_uuid: str):
        return Response(
            {
                "uuid": song_uuid,
                "status": UploadManager(song_uuid).get_status() or "unknown",
            }
        )


class SongUserCollections(APIView):
    def get(self, request, collection_song_uuid: str):
        collection_song = get_object_or_404(CollectionSong, uuid=collection_song_uuid)

        profile: StreamingProfile = request.user.streamingprofile
        user_collection_ids = list(
            profile.created_collections.values_list("id", flat=True)
        )
        user_collection_ids.append(profile.liked_songs.id)

        rows = CollectionSong.objects.filter(
            song=collection_song.song, collection__id__in=user_collection_ids
        ).values_list("collection__uuid", "uuid")

        return Response(
            {
                "collections": [
                    {
                        "collection_uuid": str(collection_uuid),
                        "collection_song_uuid": str(cs_uuid),
                    }
                    for collection_uuid, cs_uuid in rows
                ]
            }
        )
