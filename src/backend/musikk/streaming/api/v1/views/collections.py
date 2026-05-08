import dataclasses
import tempfile
from pathlib import Path

from django.conf import settings
from django.db import transaction
from musikk.pagination import BaseLimitOffsetPagination
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.generics import (
    ListCreateAPIView,
    RetrieveUpdateAPIView,
    get_object_or_404,
)
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import SAFE_METHODS
from rest_framework.response import Response
from rest_framework.views import APIView
from websockets.event_helpers import send_ws_event, user_group

from streaming.api.v1.filters import CollectionFilter
from streaming.api.v1.serializers import BaseSongCreateSerializer
from streaming.api.v1.serializers.collections import (
    CollectionCreateSerializer,
    CollectionSerializerBasic,
    CollectionSerializerDetailed,
    CollectionUpdateSerializer,
    collection_optimizations,
)
from streaming.audio.tasks import convert_audio
from streaming.audio.validators import validate_audio
from streaming.managers.upload_manager import UploadManager
from streaming.models.collections import Collection, CollectionType
from streaming.models.songs import BaseSong, CollectionSong
from streaming.permissions import (
    IsArtistForAlbumCreation,
    IsCollecitonAuthor,
    IsPublicOrCollectionAuthor,
)
from streaming.ws.events import ServerEvent


class CollectionListCreateView(ListCreateAPIView):
    queryset = Collection.objects.filter(private=False, draft=False).order_by(
        "-date_added"
    )
    filterset_class = CollectionFilter
    pagination_class = BaseLimitOffsetPagination
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        qs = super().get_queryset()
        if self.request.method == "GET":
            qs = collection_optimizations(qs)
        return qs

    def get_serializer_class(self):
        return (
            CollectionCreateSerializer
            if self.request.method == "POST"
            else CollectionSerializerBasic
        )

    def get_permissions(self):
        permissions = super().get_permissions()
        if self.request.method == "POST":
            return permissions + [IsArtistForAlbumCreation()]
        return permissions

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == status.HTTP_201_CREATED:
            send_ws_event(
                user_group(self.request.user.uuid),
                ServerEvent.LIBRARY_CHANGED,
            )
        return response


class UserLibraryView(APIView):
    serializer_class = CollectionSerializerBasic

    def get(self, request, *args, **kwargs):
        profile = request.user.streamingprofile
        ctx = {"request": request}

        created_qs = collection_optimizations(profile.created_collections)
        created_ids = list(created_qs.values_list("id", flat=True))

        liked_qs = collection_optimizations(
            profile.liked_collections.exclude(id__in=created_ids)
        )

        history = CollectionSerializerBasic(profile.history, context=ctx).data
        liked_songs = CollectionSerializerBasic(profile.liked_songs, context=ctx).data
        created_collections = CollectionSerializerBasic(
            created_qs, context=ctx, many=True
        ).data
        liked_collections = CollectionSerializerBasic(
            liked_qs, context=ctx, many=True
        ).data

        return Response(
            status=status.HTTP_200_OK,
            data={
                "history": history,
                "liked_songs": liked_songs,
                "created_collections": created_collections,
                "liked_collections": liked_collections,
            },
        )


class CollectionRetrieveView(APIView):
    def get_permissions(self):
        if self.request.method == "DELETE":
            return [IsCollecitonAuthor()]
        return [IsPublicOrCollectionAuthor()]

    def get(self, request, *args, **kwargs):
        collection = get_object_or_404(
            Collection.objects.published(), uuid=kwargs["uuid"]
        )
        self.check_object_permissions(request, collection)
        data = CollectionSerializerBasic(collection, context={"request": request}).data
        return Response(status=status.HTTP_200_OK, data=data)

    def delete(self, request, *args, **kwargs):
        collection = get_object_or_404(Collection, uuid=kwargs["uuid"])
        self.check_object_permissions(request, collection)

        # TODO: albums should be as well, but we need song handling
        if collection.type != CollectionType.PLAYLIST:
            raise ValidationError("Only playlists can be deleted.")

        collection.delete()
        send_ws_event(
            user_group(request.user.uuid),
            ServerEvent.LIBRARY_CHANGED,
        )
        return Response(status=status.HTTP_204_NO_CONTENT)


class CollectionRetrieveUpdateView(RetrieveUpdateAPIView):
    lookup_field = "uuid"
    queryset = Collection.objects.all()
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        qs = super().get_queryset()
        if self.request.method in SAFE_METHODS:
            qs = qs.published()
        return qs

    def get_permissions(self):
        if self.request.method in SAFE_METHODS:
            return [IsPublicOrCollectionAuthor()]
        return [IsCollecitonAuthor()]

    def get_serializer_class(self):
        if self.request.method in SAFE_METHODS:
            return CollectionSerializerDetailed
        return CollectionUpdateSerializer

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        was_draft = instance.draft
        serializer = CollectionUpdateSerializer(
            instance,
            data=request.data,
            partial=kwargs.pop("partial", False),
            context=self.get_serializer_context(),
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        if was_draft and not instance.draft:
            send_ws_event(
                user_group(request.user.uuid),
                ServerEvent.LIBRARY_CHANGED,
            )

        return Response(
            CollectionSerializerDetailed(
                instance, context=self.get_serializer_context()
            ).data
        )


class CollectionAddLikedView(APIView):
    permission_classes = [IsPublicOrCollectionAuthor]

    def post(self, request, *args, **kwargs):
        collection_uuid = kwargs["uuid"]
        with transaction.atomic():
            collection = get_object_or_404(Collection, uuid=collection_uuid)
            self.check_object_permissions(request, collection)
            self.request.user.streamingprofile.liked_collections.add(collection)

        group = user_group(self.request.user.uuid)
        send_ws_event(group, ServerEvent.COLLECTION_CHANGED)
        send_ws_event(group, ServerEvent.LIBRARY_CHANGED)
        send_ws_event(group, ServerEvent.LIKED_COLLECTIONS_CHANGED)
        return Response(status=status.HTTP_204_NO_CONTENT)

    def delete(self, request, *args, **kwargs):
        collection_uuid = kwargs["uuid"]
        with transaction.atomic():
            collection = get_object_or_404(Collection, uuid=collection_uuid)
            self.check_object_permissions(request, collection)
            self.request.user.streamingprofile.liked_collections.remove(collection)

        group = user_group(self.request.user.uuid)
        send_ws_event(group, ServerEvent.COLLECTION_CHANGED)
        send_ws_event(group, ServerEvent.LIBRARY_CHANGED)
        send_ws_event(group, ServerEvent.LIKED_COLLECTIONS_CHANGED)
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
            user_group(self.request.user.uuid),
            ServerEvent.COLLECTION_CHANGED,
        )
        return Response(
            status=status.HTTP_200_OK,
        )


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
            user_group(request.user.uuid),
            ServerEvent.COLLECTION_CHANGED,
        )
        return Response(
            data={
                "song_uuid": str(base_song_inst.uuid),
                "collection_song_uuid": str(collection_song_inst.uuid),
            },
            status=status.HTTP_201_CREATED,
        )

    def _create_album_song(self, request, collection):
        if not request.data.get("operation_id"):
            return Response(
                data={"detail": "Can not upload a Song without an `operation_id`"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        audio = request.data.get("audio")
        if not audio:
            return Response(
                data={"detail": "An audio file is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        upload_tmp_dir = Path(settings.UPLOAD_TMP_DIR)
        upload_tmp_dir.mkdir(parents=True, exist_ok=True)

        with tempfile.NamedTemporaryFile(dir=upload_tmp_dir, delete=False) as tmp:
            for chunk in audio.chunks():
                tmp.write(chunk)
            temp_path = tmp.name

        try:
            audio_info = validate_audio(temp_path)
        except Exception:
            Path(temp_path).unlink(missing_ok=True)
            raise

        serializer = BaseSongCreateSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)

        base_song_inst = serializer.save()
        collection_song_inst = CollectionSong.objects.create(
            collection=collection, song=base_song_inst
        )

        UploadManager(song_uuid=base_song_inst.uuid).set_status("queued")
        try:
            convert_audio.apply_async(
                kwargs={
                    "file_path": temp_path,
                    "song_uuid": str(base_song_inst.uuid),
                    "initiator_uuid": str(request.user.uuid),
                    "operation_id": request.data["operation_id"],
                    "audio_info": dataclasses.asdict(audio_info),
                }
            )
        except Exception:
            Path(temp_path).unlink(missing_ok=True)
            raise
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
            uuid=kwargs["uuid"],
        )

        album = get_object_or_404(
            Collection.objects.published(),
            type=CollectionType.ALBUM,
            base_songs=collection_song.song,
        )
        self.check_object_permissions(request, album)

        data = CollectionSerializerBasic(album, context={"request": request}).data
        return Response(status=status.HTTP_200_OK, data=data)
