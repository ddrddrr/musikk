from functools import partial
from uuid import UUID, uuid7

from base.openapi import NO_CONTENT_SCHEMA
from django.db import IntegrityError, transaction
from drf_spectacular.utils import (
    PolymorphicProxySerializer,
    extend_schema,
    extend_schema_view,
    inline_serializer,
)
from musikk.pagination import BaseLimitOffsetPagination
from rest_framework import serializers, status
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
from streaming.api.v1.serializers.songs import (
    AlbumTrackCreateSerializer,
    AlbumTrackSerializer,
    AlbumTrackUploadSerializer,
)
from streaming.audio.tasks import create_song_conversion_task
from streaming.audio.upload_files import delete_track_dir, move_upload_to_track_dir
from streaming.audio.validators import validate_audio
from streaming.models.collections import Collection, CollectionType
from streaming.models.songs import BaseSong, CollectionSong
from streaming.permissions import (
    IsArtistForAlbumCreation,
    IsCollecitonAuthor,
    IsPublicOrCollectionAuthor,
)
from streaming.ws.events import ServerEvent


class CollectionListCreateView(ListCreateAPIView):
    queryset = Collection.objects.public().published().order_by("-date_added")
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

    @extend_schema(
        responses=inline_serializer(
            name="UserLibrary",
            fields={
                "history": CollectionSerializerBasic(),
                "liked_songs": CollectionSerializerBasic(),
                "created_collections": CollectionSerializerBasic(many=True),
                "liked_collections": CollectionSerializerBasic(many=True),
            },
        )
    )
    def get(self, request, *args, **kwargs):
        profile = request.user.streamingprofile
        ctx = {"request": request}

        created_qs = collection_optimizations(profile.created_collections)
        created_ids = list(created_qs.values_list("pk", flat=True))

        liked_qs = collection_optimizations(
            profile.liked_collections.exclude(pk__in=created_ids)
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

    @extend_schema(responses=CollectionSerializerBasic)
    def get(self, request, *args, **kwargs):
        collection = get_object_or_404(
            Collection.objects.published(), uuid=kwargs["uuid"]
        )
        self.check_object_permissions(request, collection)
        data = CollectionSerializerBasic(collection, context={"request": request}).data
        return Response(status=status.HTTP_200_OK, data=data)

    @NO_CONTENT_SCHEMA
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


@extend_schema_view(
    put=extend_schema(responses=CollectionSerializerDetailed),
    patch=extend_schema(responses=CollectionSerializerDetailed),
)
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

    @NO_CONTENT_SCHEMA
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

    @NO_CONTENT_SCHEMA
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


class CollectionRemoveSongView(APIView):
    permission_classes = [IsCollecitonAuthor]

    @extend_schema(responses={200: None})
    def delete(self, *args, **kwargs):
        collection_song = get_object_or_404(
            CollectionSong.objects.select_related("collection", "song"),
            collection__uuid=kwargs["collection_uuid"],
            uuid=kwargs["collection_song_uuid"],
        )
        self.check_object_permissions(self.request, collection_song)

        collection = collection_song.collection
        if collection.type == CollectionType.ALBUM and collection.draft:
            # album not finalized yet, so we delete the actual song files
            collection_song.song.delete()
        else:
            # otherwise we just "unlink" the song from the collection
            collection_song.delete()

        send_ws_event(
            user_group(self.request.user.uuid),
            ServerEvent.COLLECTION_CHANGED,
        )
        return Response(
            status=status.HTTP_200_OK,
        )


class CollectionSongListCreateView(APIView):
    permission_classes = [IsCollecitonAuthor]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    @extend_schema(responses=AlbumTrackSerializer(many=True))
    def get(self, request, *args, **kwargs):
        album = get_object_or_404(
            Collection, uuid=kwargs["collection_uuid"], type=CollectionType.ALBUM
        )
        self.check_object_permissions(request, album)

        tracks = (
            CollectionSong.objects.filter(collection=album)
            .select_related("song")
            .order_by("position")
        )
        return Response(AlbumTrackSerializer(tracks, many=True).data)

    @extend_schema(
        description="Albums take a track upload and answer with the track. "
        "Other collections take an existing song and answer with the new link.",
        request=PolymorphicProxySerializer(
            component_name="CollectionSongCreate",
            serializers=[
                AlbumTrackCreateSerializer,
                inline_serializer(
                    name="PlaylistSongCreate",
                    fields={"song_uuid": serializers.UUIDField()},
                ),
            ],
            resource_type_field_name=None,
        ),
        responses={
            200: AlbumTrackSerializer,
            201: inline_serializer(
                name="CollectionSongCreated",
                fields={
                    "song_uuid": serializers.UUIDField(),
                    "collection_song_uuid": serializers.UUIDField(),
                },
            ),
            202: AlbumTrackSerializer,
        },
    )
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

    def _create_album_song(self, request, collection: Collection) -> Response:
        if not collection.draft:
            raise ValidationError(
                "Songs can only be created for an album that is a draft."
            )

        upload = AlbumTrackUploadSerializer(data=request.data)
        upload.is_valid(raise_exception=True)
        operation_id = upload.validated_data["operation_id"]

        if existing := _find_album_song(collection, operation_id):
            return Response(AlbumTrackSerializer(existing).data, status.HTTP_200_OK)

        song_serializer = BaseSongCreateSerializer(
            data=request.data, context={"request": request}
        )
        song_serializer.is_valid(raise_exception=True)

        audio = upload.validated_data["audio"]
        song_uuid = uuid7()
        try:
            source = move_upload_to_track_dir(
                audio.temporary_file_path(), song_uuid, audio.name
            )
            audio_info = validate_audio(source)
            with transaction.atomic():
                song = song_serializer.save(uuid=song_uuid)
                collection_song = CollectionSong.objects.create(
                    collection=collection,
                    song=song,
                    operation_id=operation_id,
                    position=upload.validated_data["position"],
                )
                transaction.on_commit(
                    partial(
                        create_song_conversion_task,
                        song_uuid,
                        request.user.uuid,
                        audio_info,
                    )
                )
        except IntegrityError:
            delete_track_dir(song_uuid)
            existing = _find_album_song(collection, operation_id)
            if existing is None:
                raise
            return Response(AlbumTrackSerializer(existing).data, status.HTTP_200_OK)
        except Exception:
            delete_track_dir(song_uuid)
            raise

        collection_song.song.refresh_from_db(fields=["status", "status_detail"])
        return Response(
            AlbumTrackSerializer(collection_song).data, status.HTTP_202_ACCEPTED
        )


def _find_album_song(
    collection: Collection, operation_id: UUID
) -> CollectionSong | None:
    return (
        CollectionSong.objects.select_related("song")
        .filter(collection=collection, operation_id=operation_id)
        .first()
    )


class AlbumBySongView(APIView):
    permission_classes = [IsPublicOrCollectionAuthor]

    @extend_schema(responses=CollectionSerializerBasic)
    def get(self, request, *args, **kwargs):
        album = get_object_or_404(
            Collection.objects.published(),
            type=CollectionType.ALBUM,
            base_songs__uuid=kwargs["song_uuid"],
        )
        self.check_object_permissions(request, album)

        data = CollectionSerializerBasic(album, context={"request": request}).data
        return Response(status=status.HTTP_200_OK, data=data)
