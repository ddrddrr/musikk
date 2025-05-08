import json
from uuid import UUID

from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework import status, serializers
from rest_framework.views import APIView
from rest_framework.generics import (
    ListAPIView,
    RetrieveAPIView,
    get_object_or_404,
)
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from sse.config import EventChannels
from sse.events import send_invalidate_event
from streaming.api.v1.serializers_song_collection import (
    SongCollectionSerializerBasic,
    SongCollectionSerializerDetailed,
)
from streaming.api.v1.serializers_song import BaseSongCreateSerializer
from streaming.api.v1.serializers_song_collection import SongCollectionCreateSerializer
from streaming.models import BaseSong, SongCollectionSong, SongCollection


class SongAddLikedView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        user = request.user.streaminguser

        scs_uuid = kwargs["collection_song_uuid"]
        scs = get_object_or_404(SongCollectionSong, uuid=scs_uuid)
        song = SongCollectionSong.objects.create(
            song=scs.song, song_collection=user.liked_songs
        )

        # doing a refetch for the queue is easier than traversing nodes and checking, whether the song is in the queue
        send_invalidate_event(EventChannels.user_events(user.uuid), ["queue"])
        send_invalidate_event(EventChannels.user_events(user.uuid), ["openCollection"])
        send_invalidate_event(EventChannels.user_events(user.uuid), ["likedSongs"])
        return Response(status=status.HTTP_200_OK, data={"collection_song": song})


class SongCreateView(APIView):
    """
    { authors: [UUID], songs: [ { key: 'song_0', title, description }, ... ] }
    + song_{i}_audio, song_{i}_image.
    """

    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        raw = request.data.get("info")
        if not raw:
            return Response(
                {"detail": "Missing info payload"}, status=status.HTTP_400_BAD_REQUEST
            )

        info = json.loads(raw)
        authors = info.get("authors") or [str(request.user.streaminguser.uuid)]
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
            except serializers.ValidationError as exc:
                failed.append({"key": key, "errors": exc.detail})
            except Exception as exc:
                failed.append({"key": key, "errors": [str(exc)]})

        if failed:
            response_status = status.HTTP_400_BAD_REQUEST
        else:
            response_status = status.HTTP_201_CREATED
        return Response(
            {"succeeded": succeeded, "failed": failed}, status=response_status
        )


class SongCollectionLatestView(ListAPIView):
    permission_classes = [IsAuthenticated]
    queryset = SongCollection.objects.all()
    serializer_class = SongCollectionSerializerBasic

    def get_queryset(self):
        qs = super().get_queryset().exclude(private=True).order_by("-date_added")[:20]
        return qs


class SongCollectionPersonalView(APIView):
    """Returns `liked_songs` and `followed_collections` of a `StreamingUser`"""

    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = self.request.user.streaminguser

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


class SongCollectionDetailView(RetrieveAPIView):
    lookup_field = "uuid"
    permission_classes = [IsAuthenticated]
    queryset = SongCollection.objects.all()
    serializer_class = SongCollectionSerializerDetailed


# TODO: invalidate fetched user collections
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

        scs_uuid = kwargs["collection_song_uuid"]
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


# TODO: rewrite, as scs_uuid will be passed
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
        scs_uuid = kwargs["collection_song_uuid"]
        song = get_object_or_404(SongCollectionSong, uuid=scs_uuid)
        SongCollectionSong.objects.create(song=song, song_collection=collection)
        return Response(status=status.HTTP_204_NO_CONTENT)


class SongCollectionCreateView(APIView):
    """
    { title, description, image?, private, authors: [UUID], songs: [UUID,...] }
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
        }
        serializer = SongCollectionCreateSerializer(
            data=payload, context={"request": request}
        )
        try:
            serializer.is_valid(raise_exception=True)
        except serializers.ValidationError as exc:
            return Response({"failed": exc.detail}, status=status.HTTP_400_BAD_REQUEST)

        collection = serializer.save()
        for scsong in SongCollectionSong.objects.filter(song_collection=collection):
            scsong.song.draft = False
            scsong.song.save(update_fields=["draft"])

        out = SongCollectionSerializerBasic(
            collection, context={"request": request}
        ).data
        return Response({"collection": out}, status=201)


# TODO: streams will be needed for statistics, not for history
# class StreamCreateView(CreateAPIView):
#     permission_classes = [IsAuthenticated]
#     queryset =
