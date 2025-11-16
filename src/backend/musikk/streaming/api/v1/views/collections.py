from django.db import transaction
from rest_framework import status, serializers
from rest_framework.generics import ListAPIView, RetrieveAPIView, get_object_or_404
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import NotFound

from websockets.event_helpers import send_ws_event
from streaming.api.v1.serializers.collections import (
    CollectionSerializerBasic,
    CollectionSerializerDetailed,
    CollectionCreateSerializer,
)
from streaming.models.collections import Collection
from streaming.models.songs import CollectionSong


class CollectionLatestView(ListAPIView):
    permission_classes = [IsAuthenticated]
    queryset = Collection.objects.all()
    serializer_class = CollectionSerializerBasic
    amount = 50

    def get_queryset(self):
        qs = (
            super()
            .get_queryset()
            .exclude(private=True)
            .order_by("-date_added")[: self.amount]
        )
        return qs


class CollectionPersonalView(APIView):
    permission_classes = [IsAuthenticated]
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
    permission_classes = [IsAuthenticated]
    queryset = Collection.objects.all()
    serializer_class = CollectionSerializerBasic


class CollectionDetailView(RetrieveAPIView):
    lookup_field = "uuid"
    permission_classes = [IsAuthenticated]
    queryset = Collection.objects.all()
    serializer_class = CollectionSerializerDetailed


class CollectionAddLikedView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        user = self.request.user
        user_uuid = user.uuid

        collection_uuid = kwargs["uuid"]
        with transaction.atomic():
            collection = get_object_or_404(Collection, uuid=collection_uuid)
            user.streamingprofile.followed_collections.add(collection)

        send_ws_event(f"user_{user_uuid}", event_handler="base.event", event_name="invalidate.query", query_key=["openCollection"])
        send_ws_event(f"user_{user_uuid}", event_handler="base.event", event_name="invalidate.query", query_key=["collectionsPersonal"])
        return Response(status=status.HTTP_204_NO_CONTENT)


class CollectionRemoveSong(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, *args, **kwargs):
        collection_uuid = kwargs["collection_uuid"]
        collection_song_uuid = kwargs["song_uuid"]

        collection_song = get_object_or_404(
            CollectionSong,
            collection__uuid=collection_uuid,
            uuid=collection_song_uuid,
            author=request.user,
        )

        collection_song.delete()
        send_ws_event(f"user_{self.request.user.uuid}", event_handler="base.event", event_name="invalidate.query", query_key=["openCollection"])
        return Response(
            status=status.HTTP_200_OK,
        )


class CollectionAddSong(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        collection_uuid = kwargs["collection_uuid"]
        collection_song_uuid = kwargs["song_uuid"]

        user = request.user
        with transaction.atomic():
            collection = get_object_or_404(
                Collection, uuid=collection_uuid, authors__in=user
            )
            collection_song = get_object_or_404(
                CollectionSong, uuid=collection_song_uuid
            )

            CollectionSong.objects.create(
                song=collection_song.song, collection=collection
            )

        return Response(status=status.HTTP_204_NO_CONTENT)


class CollectionCreateView(APIView):
    """
    { title, description, image?, private, authors: [UUID], songs: [UUID,...], type }
    """

    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        data = request.data.copy()

        authors = data.getlist("authors", [str(request.user.uuid)])
        if not isinstance(authors, list):
            authors = [authors]

        songs = data.getlist("songs", [])
        if not isinstance(songs, list):
            songs = [songs]

        payload = {
            "title": data.get("title"),
            "description": data.get("description", ""),
            "image": request.FILES.get("image"),
            "authors": authors,
            "songs": songs,
            "type": data.get("type"),
        }
        serializer = CollectionCreateSerializer(
            data=payload, context={"request": request}
        )
        try:
            serializer.is_valid(raise_exception=True)
        except serializers.ValidationError as ex:
            return Response({"failed": ex.detail}, status=status.HTTP_400_BAD_REQUEST)

        serializer.save()
        return Response(status=status.HTTP_201_CREATED)


class AlbumBySongView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        collection_song_uuid = kwargs.get("song_uuid")

        with transaction.atomic():
            collection_song = get_object_or_404(
                CollectionSong, uuid=collection_song_uuid
            )
            album_song = CollectionSong.objects.filter(
                collection__type="album", song__uuid=collection_song.song.uuid
            )
            if not album_song:
                raise NotFound(f"Album for song {collection_song.song.uuid} not found.")

            album = get_object_or_404(
                Collection, type="album", uuid=album_song[0].collection.uuid
            )

        album = CollectionSerializerBasic(album, context={"request": request}).data
        return Response(status=status.HTTP_200_OK, data=album)
