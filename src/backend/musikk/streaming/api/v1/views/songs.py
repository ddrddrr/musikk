import logging

from base.openapi import NO_CONTENT_SCHEMA
from drf_spectacular.utils import extend_schema, inline_serializer
from rest_framework import serializers, status
from rest_framework.generics import RetrieveAPIView, get_object_or_404
from rest_framework.response import Response
from rest_framework.views import APIView
from websockets.event_helpers import send_ws_event, user_group

from streaming.api.v1.serializers.songs import CollectionSongRetrieveSerializer
from streaming.models.profile import StreamingProfile
from streaming.models.songs import CollectionSong
from streaming.permissions import IsPublicOrCollectionAuthor
from streaming.ws.events import ServerEvent

logger = logging.getLogger(__name__)


class CollectionSongRetrieveView(RetrieveAPIView):
    permission_classes = [IsPublicOrCollectionAuthor]
    queryset = CollectionSong.objects.all()
    serializer_class = CollectionSongRetrieveSerializer
    lookup_field = "uuid"


class SongAddLikedView(APIView):
    permission_classes = [IsPublicOrCollectionAuthor]

    @NO_CONTENT_SCHEMA
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
        send_ws_event(group, ServerEvent.LIKED_SONGS_CHANGED)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @NO_CONTENT_SCHEMA
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
        send_ws_event(group, ServerEvent.LIKED_SONGS_CHANGED)
        return Response(status=status.HTTP_204_NO_CONTENT)


class SongUserCollections(APIView):
    @extend_schema(
        responses=inline_serializer(
            name="SongUserCollections",
            fields={
                "collections": inline_serializer(
                    name="SongCollectionLink",
                    fields={
                        "collection_uuid": serializers.UUIDField(),
                        "collection_song_uuid": serializers.UUIDField(),
                    },
                    many=True,
                )
            },
        )
    )
    def get(self, request, collection_song_uuid: str):
        collection_song = get_object_or_404(CollectionSong, uuid=collection_song_uuid)

        profile: StreamingProfile = request.user.streamingprofile
        user_collection_ids = list(
            profile.created_collections.values_list("pk", flat=True)
        )
        user_collection_ids.append(profile.liked_songs.pk)

        rows = CollectionSong.objects.filter(
            song=collection_song.song, collection__pk__in=user_collection_ids
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
