from streaming.song_collections import LikedSongs
from streaming.api.v1.views_song import *
from streaming.api.v1.views_collection import *
from streaming.api.v1.views_playback import *
from streaming.api.v1.views_song_queue import *
from users.api.v1.serializers_base import BaseUserSerializer


# [{user: ..., song:...}
class ConnectionsLatestListenedView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user.streaminguser
        friends = user.friends.filter(playback_state__is_playing=True).select_related(
            "song_queue__head__song"
        )

        user_songs = []
        for f in friends:
            song_queue = getattr(f, "song_queue", None)
            if song_queue and song_queue.head and (song := song_queue.head.song):
                user_songs.append(
                    {
                        "user": BaseUserSerializer(
                            f, context={"request": request}
                        ).data,
                        "song": SongCollectionSongSerializer(
                            song, context={"request": request}
                        ).data,
                    }
                )

        return Response(status=status.HTTP_200_OK, data=user_songs)


class ConnectionsLatestAddedView(APIView):
    permission_classes = [IsAuthenticated]
    amount = 30

    def get(self, request, *args, **kwargs):
        user = request.user.streaminguser

        friends = user.friends.all()

        collections = SongCollection.objects.filter(followers__in=friends).order_by(
            "-date_added"
        )[: self.amount]
        collections = SongCollectionSerializerBasic(
            collections, many=True, context={"request": request}
        ).data

        f_liked_songs = LikedSongs.objects.filter(user__in=friends)
        songs = SongCollectionSong.objects.filter(
            song_collection__in=f_liked_songs
        ).order_by("-date_added")[: self.amount]
        songs = SongCollectionSongSerializer(
            songs, many=True, context={"request": request}
        ).data

        return Response(
            status=status.HTTP_200_OK, data={"collections": collections, "songs": songs}
        )
