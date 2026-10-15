from django.db.models import Prefetch
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from users.api.v1.serializers import BaseUserSerializer

from streaming.api.v1.serializers import CollectionSongRetrieveSerializer
from streaming.models import SongCredit


class FriendsLatestListenedView(APIView):
    def get(self, request, *args, **kwargs):
        friends_qs = self.request.user.friends.select_related(
            "streamingprofile__stored_playback_state__current_collection_song__song",
        ).prefetch_related(
            Prefetch(
                "streamingprofile__stored_playback_state__current_collection_song__song__credits",
                queryset=SongCredit.objects.select_related("author"),
            ),
        )

        friends_latest_listened = []
        for f in friends_qs:
            stored_playback_state = f.streamingprofile.stored_playback_state
            if not stored_playback_state.is_playing():
                continue
            current = stored_playback_state.current_collection_song
            friends_latest_listened.append(
                {
                    "user": BaseUserSerializer(f, context={"request": request}).data,
                    "song": CollectionSongRetrieveSerializer(
                        current, context={"request": request}
                    ).data,
                }
            )

        return Response(status=status.HTTP_200_OK, data=friends_latest_listened)
