import tempfile

from django.db import transaction
from rest_framework import status
from rest_framework.generics import (
    RetrieveAPIView,
    get_object_or_404,
    ListCreateAPIView,
)
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
from rest_framework.views import APIView

from musikk.pagination import BaseLimitOffsetPagination
from streaming.api.v1.serializers import BaseSongCreateSerializer
from streaming.audio.validators import validate_audio
from streaming.managers.upload_manager import UploadManager
from users.permissions import IsArtist
from websockets.event_helpers import send_ws_event
from streaming.api.v1.filters import CollectionFilter
from streaming.api.v1.serializers.collections import (
    CollectionSerializerBasic,
    CollectionSerializerDetailed,
    CollectionCreateSerializer,
)
from streaming.models.collections import Collection, CollectionType
from streaming.models.songs import CollectionSong, BaseSong
from streaming.permissions import IsPublicOrCollectionAuthor, IsCollecitonAuthor
from streaming.audio.tasks import convert_audio


class CollectionListCreateView(ListCreateAPIView):
    queryset = Collection.objects.filter(private=False).order_by("-date_added")
    filterset_class = CollectionFilter
    pagination_class = BaseLimitOffsetPagination
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_serializer_class(self):
        return (
            CollectionCreateSerializer
            if self.request.method == "POST"
            else CollectionSerializerBasic
        )

    def get_permissions(self):
        permissions = super().get_permissions()
        if self.request.method == "POST":
            return permissions + [IsArtist()]
        return permissions


class CollectionPersonalView(APIView):
    serializer_class = CollectionSerializerBasic

    def get(self, request, *args, **kwargs):
        profile = self.request.user.streamingprofile

        history = CollectionSerializerBasic(
            profile.history, context={"request": request}
        ).data
        liked_songs = CollectionSerializerBasic(
            profile.liked_songs, context={"request": request}
        ).data

        followed_collections = CollectionSerializerBasic(
            profile.followed_collections.all(),
            context={"request": request},
            many=True,
        ).data

        return Response(
            status=status.HTTP_200_OK,
            data={
                "history": history,
                "liked_songs": liked_songs,
                "followed_collections": followed_collections,
            },
        )


class CollectionRetrieveView(RetrieveAPIView):
    lookup_field = "uuid"
    permission_classes = [IsPublicOrCollectionAuthor]
    queryset = Collection.objects.all()
    serializer_class = CollectionSerializerBasic


class CollectionDetailView(RetrieveAPIView):
    lookup_field = "uuid"
    permission_classes = [IsPublicOrCollectionAuthor]
    queryset = Collection.objects.all()
    serializer_class = CollectionSerializerDetailed


class CollectionAddLikedView(APIView):
    permission_classes = [IsPublicOrCollectionAuthor]

    def post(self, request, *args, **kwargs):
        collection_uuid = kwargs["uuid"]
        with transaction.atomic():
            collection = get_object_or_404(Collection, uuid=collection_uuid)
            self.check_object_permissions(request, collection)
            self.request.user.streamingprofile.followed_collections.add(collection)

        # TODO: move?
        send_ws_event(
            f"user_{self.request.user.uuid}",
            event_name="invalidate.query",
            query_key=["openCollection"],
        )
        send_ws_event(
            f"user_{self.request.user.uuid}",
            event_name="invalidate.query",
            query_key=["collectionsPersonal"],
        )
        return Response(status=status.HTTP_204_NO_CONTENT)


class CollectionRemoveSong(APIView):
    permission_classes = [IsCollecitonAuthor]

    def delete(self, *args, **kwargs):
        collection_song = get_object_or_404(
            CollectionSong,
            collection__uuid=kwargs["collection_uuid"],
            uuid=kwargs["song_uuid"],
        )
        self.check_object_permissions(self.request, collection_song)

        collection_song.delete()
        send_ws_event(
            f"user_{self.request.user.uuid}",
            event_name="invalidate.query",
            query_key=["openCollection"],
        )
        return Response(
            status=status.HTTP_200_OK,
        )


# TODO: ws events should be not per-user, but per-object
class CollectionSongCreateView(APIView):
    permission_classes = [IsCollecitonAuthor]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request, *args, **kwargs):
        collection = get_object_or_404(Collection, uuid=kwargs["collection_uuid"])
        self.check_object_permissions(request, collection)

        # TODO: split into diff views probably
        if collection.type == CollectionType.ALBUM:
            return self._create_album_song(request, collection)

        song_uuid = request.data.get("song_uuid")
        base_song_inst = get_object_or_404(BaseSong, uuid=song_uuid)
        collection_song_inst = CollectionSong.objects.create(
            collection=collection, song=base_song_inst
        )
        send_ws_event(
            f"user_{request.user.uuid}",
            event_name="invalidate.query",
            query_key=["openCollection"],
        )
        return Response(
            data={
                "song_uuid": str(base_song_inst.uuid),
                "collection_song_uuid": str(collection_song_inst.uuid),
            },
            status=status.HTTP_204_NO_CONTENT,
        )

    def _create_album_song(self, request, collection):
        if not request.data.get("operation_id"):
            return Response(status=status.HTTP_400_BAD_REQUEST)

        audio = request.data.get("audio")
        validate_audio(audio)

        serializer = BaseSongCreateSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)

        base_song_inst = serializer.save()
        collection_song_inst = CollectionSong.objects.create(
            collection=collection, song=base_song_inst
        )
        with tempfile.NamedTemporaryFile(delete=False) as tmp:
            for chunk in audio.chunks():
                tmp.write(chunk)
            temp_path = tmp.name

        UploadManager(song_uuid=base_song_inst.uuid).set_status("queued")
        convert_audio.apply_async(
            kwargs={
                "file_path": temp_path,
                "song_uuid": str(base_song_inst.uuid),
                "initiator_uuid": str(request.user.uuid),
                "operation_id": request.data["operation_id"],
            }
        )
        return Response(
            data={
                "song_uuid": str(base_song_inst.uuid),
                "collection_song_uuid": str(collection_song_inst.uuid),
            },
            status=status.HTTP_202_ACCEPTED,
        )


class AlbumBySongView(APIView):
    permission_classes = [IsPublicOrCollectionAuthor]

    def get(self, request, *args, **kwargs):
        collection_song = get_object_or_404(
            CollectionSong.objects.select_related("song"),
            uuid=kwargs["song_uuid"],
        )

        album = get_object_or_404(
            Collection,
            type=CollectionType.ALBUM,
            base_songs=collection_song.song,
        )
        self.check_object_permissions(request, album)

        data = CollectionSerializerBasic(album, context={"request": request}).data
        return Response(status=status.HTTP_200_OK, data=data)
