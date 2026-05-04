from django.db.models import Prefetch
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from users.api.v1.serializers import BaseUserSerializer

from streaming.api.v1.serializers import CollectionSongRetrieveSerializer
from streaming.managers.playback_manager import PlaybackManager
from streaming.models import SongCredit


class FriendsLatestListenedView(APIView):
    def get(self, request, *args, **kwargs):
        friends_qs = self.request.user.friends.select_related(
            "streamingprofile__player__current_collection_song__song",
        ).prefetch_related(
            Prefetch(
                "streamingprofile__player__current_collection_song__song__credits",
                queryset=SongCredit.objects.select_related("author"),
            ),
        )

        friends_latest_listened = []
        for f in friends_qs:
            if not PlaybackManager(user_uuid=f.uuid).is_playback_active():
                continue
            current = f.streamingprofile.player.current_collection_song
            if current is None:
                continue
            friends_latest_listened.append(
                {
                    "user": BaseUserSerializer(f, context={"request": request}).data,
                    "song": CollectionSongRetrieveSerializer(
                        current, context={"request": request}
                    ).data,
                }
            )

        return Response(status=status.HTTP_200_OK, data=friends_latest_listened)
