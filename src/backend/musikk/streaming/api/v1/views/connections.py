from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from streaming.api.v1.serializers import (
    CollectionSongSerializer,
    CollectionSerializerBasic,
)
from streaming.models import Collection, LikedSongs, CollectionSong
from users.api.v1.serializers import BaseProfileSerializer
from users.models import StreamingProfile


class ConnectionsLatestListenedView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        profile: StreamingProfile = request.user.streamingprofile
        friends = StreamingProfile.objects.filter(
            user__baseprofile__in=profile.friends.all(),
            playback_state__is_playing=True,
            song_queue__head__song__isnull=False,
        ).select_related(
            "user",
            "playback_state",
            "song_queue__head__song",
        )

        user_songs = []
        for f in friends:
            user_songs.append(
                {
                    "user": BaseProfileSerializer(
                        f.user.baseprofile, context={"request": request}
                    ).data,
                    "song": CollectionSongSerializer(
                        f.song_queue.head.song, context={"request": request}
                    ).data,
                }
            )

        return Response(status=status.HTTP_200_OK, data=user_songs)


# TODO: return who exactly followed the collection/song
class ConnectionsLatestAddedView(APIView):
    permission_classes = [IsAuthenticated]
    amount = 30

    def get(self, request, *args, **kwargs):
        profile: StreamingProfile = request.user.streamingprofile

        friends = StreamingProfile.objects.filter(
            user__baseprofile__in=profile.friends.all()
        )

        collections = (
            Collection.objects.filter(followers__in=friends)
            .distinct()
            .order_by("-date_added")[: self.amount]
        )
        collections = CollectionSerializerBasic(
            collections, many=True, context={"request": request}
        ).data

        # TODO: optimize for usage in serializer
        f_liked_songs = LikedSongs.objects.filter(streamingprofile__in=friends)
        songs = CollectionSong.objects.filter(collection__in=f_liked_songs).order_by(
            "-date_added"
        )[: self.amount]
        songs = CollectionSongSerializer(
            songs, many=True, context={"request": request}
        ).data

        return Response(
            status=status.HTTP_200_OK, data={"collections": collections, "songs": songs}
        )
