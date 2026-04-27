from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from users.api.v1.serializers import BaseUserSerializer

from streaming.api.v1.serializers import CollectionSongRetrieveSerializer
from streaming.managers.playback_manager import PlaybackManager


class FriendsLatestListenedView(APIView):
    def get(self, request, *args, **kwargs):
        friends_latest_listened = []
        for f in self.request.user.friends:
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
