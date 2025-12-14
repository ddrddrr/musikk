from django.db import transaction
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import status
from rest_framework.generics import (
    ListAPIView,
    RetrieveAPIView,
    get_object_or_404,
    ListCreateAPIView,
)
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
from rest_framework.views import APIView

from users.permissions import IsArtist
from websockets.event_helpers import send_ws_event
from streaming.api.v1.filters import CollectionFilter
from streaming.api.v1.serializers.collections import (
    CollectionSerializerBasic,
    CollectionSerializerDetailed,
    CollectionCreateSerializer,
)
from streaming.models.collections import Collection, CollectionType
from streaming.models.songs import CollectionSong
from streaming.permissions import IsPublicOrCollectionAuthor, IsCollecitonAuthor


class CollectionListCreateView(ListCreateAPIView):
    queryset = Collection.objects.filter(private=False).order_by("-date_added")
    filter_backends = [DjangoFilterBackend]
    filterset_class = CollectionFilter
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


class CollectionAddSong(APIView):
    permission_classes = [IsCollecitonAuthor]

    def post(self, *args, **kwargs):
        with transaction.atomic():
            collection = get_object_or_404(
                Collection,
                uuid=kwargs["collection_uuid"],
                authors__in=[self.request.user],
            )
            collection_song = get_object_or_404(
                CollectionSong, uuid=kwargs["song_uuid"]
            )

            CollectionSong.objects.create(
                song=collection_song.song, collection=collection
            )

        return Response(status=status.HTTP_204_NO_CONTENT)


# class CollectionCreateView(APIView):
#     """
#     { title, description, image?, private, authors: [UUID], songs: [UUID,...], type }
#     """
#
#     permission_classes = [IsArtist]
#     parser_classes = [MultiPartParser, FormParser]
#
#     def post(self, *args, **kwargs):
#         data = self.request.data.copy()
#
#         authors = data.getlist("authors", [])
#         if not isinstance(authors, list):
#             authors = [authors]
#
#         songs = data.getlist("songs", [])
#         if not isinstance(songs, list):
#             songs = [songs]
#
#         serializer = CollectionCreateSerializer(
#             data={
#                 "title": data["title"],
#                 "description": data.get("description", ""),
#                 "image": self.request.FILES.get("image"),
#                 "authors": authors,
#                 "songs": songs,
#                 "type": data["type"],
#             },
#             context={"request": self.request},
#         )
#
#         serializer.is_valid(raise_exception=True)
#         serializer.save()
#         return Response(status=status.HTTP_201_CREATED)


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
