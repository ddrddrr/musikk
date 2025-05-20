from uuid import UUID

from rest_framework import status, serializers
from rest_framework.generics import ListAPIView, RetrieveAPIView, get_object_or_404
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import NotFound

from sse.config import EventChannels
from sse.events import send_invalidate_event
from streaming.api.v1.serializers_song_collection import (
    SongCollectionSerializerBasic,
    SongCollectionSerializerDetailed,
    SongCollectionCreateSerializer,
)
from streaming.song_collections import SongCollection
from streaming.songs import SongCollectionSong, BaseSong
from users.users_extended import StreamingUser


class SongCollectionLatestView(ListAPIView):
    permission_classes = [IsAuthenticated]
    queryset = SongCollection.objects.all()
    serializer_class = SongCollectionSerializerBasic
    amount = 50

    def get_queryset(self):
        qs = (
            super()
            .get_queryset()
            .exclude(private=True)
            .order_by("-date_added")[: self.amount]
        )
        return qs


class SongCollectionPersonalView(APIView):
    permission_classes = [IsAuthenticated]
    serializer_class = SongCollectionSerializerBasic

    def get(self, request, *args, **kwargs):
        user = get_object_or_404(StreamingUser, uuid=kwargs.get("uuid"))

        followed_collections_qs = user.streaminguser.followed_song_collections.all()
        history = SongCollectionSerializerBasic(
            user.history, context={"request": request}
        ).data
        liked_songs = SongCollectionSerializerBasic(
            user.liked_songs, context={"request": request}
        ).data
        followed_collections = SongCollectionSerializerBasic(
            list(followed_collections_qs),
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


class SongCollectionRetrieveView(RetrieveAPIView):
    lookup_field = "uuid"
    permission_classes = [IsAuthenticated]
    queryset = SongCollection.objects.all()
    serializer_class = SongCollectionSerializerBasic


class SongCollectionDetailView(RetrieveAPIView):
    lookup_field = "uuid"
    permission_classes = [IsAuthenticated]
    queryset = SongCollection.objects.all()
    serializer_class = SongCollectionSerializerDetailed


class SongCollectionAddLikedView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        user = request.user.streaminguser

        collection_uuid = kwargs["uuid"]
        collection = get_object_or_404(SongCollection, uuid=collection_uuid)
        user.followed_song_collections.add(collection)
        send_invalidate_event(EventChannels.user_events(user.uuid), ["openCollection"])
        send_invalidate_event(
            EventChannels.user_events(user.uuid), ["collectionsPersonal"]
        )
        return Response(status=status.HTTP_204_NO_CONTENT)


class SongCollectionRemoveSong(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, *args, **kwargs):
        user = request.user.streaminguser
        collection = get_object_or_404(SongCollection, uuid=kwargs["collection_uuid"])
        if (
            collection.id not in (user.liked_songs.id, user.history.id)
        ) and collection not in user.authored_collections_link.all():
            return Response(
                status=status.HTTP_403_FORBIDDEN,
                data={
                    f"The user {user.uuid} is not an author of collection {collection.uuid}."
                },
            )

        scs_uuid = kwargs["song_uuid"]
        sc_song = get_object_or_404(
            SongCollectionSong,
            song_collection=collection,
            uuid=scs_uuid,
        )
        sc_song.delete()
        send_invalidate_event(EventChannels.user_events(user.uuid), ["openCollection"])
        return Response(
            status=status.HTTP_200_OK,
            data={"removed": scs_uuid},
        )


class SongCollectionAddSong(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        user = request.user.streaminguser
        collection = get_object_or_404(SongCollection, uuid=kwargs["collection_uuid"])
        if (
            collection.id not in (user.liked_songs.id, user.history.id)
        ) and collection not in user.authored_collections_link.all():
            return Response(
                status=status.HTTP_403_FORBIDDEN,
                data={
                    f"The user {user.uuid} is not an author of collection {collection.uuid}."
                },
            )
        scs_uuid = kwargs["song_uuid"]
        song = get_object_or_404(SongCollectionSong, uuid=scs_uuid)
        SongCollectionSong.objects.create(song=song, song_collection=collection)
        return Response(status=status.HTTP_204_NO_CONTENT)


class SongCollectionCreateView(APIView):
    """
    { title, description, image?, private, authors: [UUID], songs: [UUID,...], type }
    """

    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        data = request.data.copy()

        authors = data.getlist("authors", [str(request.user.streaminguser.uuid)])
        if not isinstance(authors, list):
            authors = [authors]

        songs = data.getlist("songs", [])
        if not isinstance(songs, list):
            songs = [songs]

        bad_songs = []
        for uuid_str in songs:
            try:
                UUID(uuid_str)
                BaseSong.objects.get(uuid=uuid_str)
            except Exception as e:
                bad_songs.append({"uuid": uuid_str, "error": str(e)})

        if bad_songs:
            return Response({"failed": bad_songs}, status=status.HTTP_400_BAD_REQUEST)

        payload = {
            "title": data.get("title"),
            "description": data.get("description", ""),
            "image": request.FILES.get("image"),
            "authors": authors,
            "songs": songs,
            "type": data.get("type"),
        }
        serializer = SongCollectionCreateSerializer(
            data=payload, context={"request": request}
        )
        try:
            serializer.is_valid(raise_exception=True)
        except serializers.ValidationError as ex:
            return Response({"failed": ex.detail}, status=status.HTTP_400_BAD_REQUEST)

        collection = serializer.save()
        for scsong in SongCollectionSong.objects.filter(song_collection=collection):
            scsong.song.draft = False
            scsong.song.save(update_fields=["draft"])

        out = SongCollectionSerializerBasic(
            collection, context={"request": request}
        ).data
        return Response({"collection": out}, status=201)


class AlbumBySongView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        scs_uuid = kwargs["uuid"]
        scs = get_object_or_404(SongCollectionSong, uuid=scs_uuid)
        album_song = SongCollectionSong.objects.filter(
            song_collection__type="album", song__uuid=scs.song.uuid
        )
        if not album_song:
            raise NotFound(f"Album for song {scs.song.uuid} not found.")

        album = get_object_or_404(
            SongCollection, type="album", uuid=album_song[0].song_collection.uuid
        )
        album = SongCollectionSerializerBasic(album, context={"request": request}).data
        return Response(status=status.HTTP_200_OK, data=album)
