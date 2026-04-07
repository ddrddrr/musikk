from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from streaming.api.v1.serializers import CollectionSongRetrieveSerializer
from streaming.managers.playback_manager import PlaybackManager
from users.api.v1.serializers import BaseUserSerializer


class FriendsLatestListenedView(APIView):
    def get(self, request, *args, **kwargs):
        friends_latest_listened = []
        for f in self.request.user.friends:
            if PlaybackManager(user_uuid=f.uuid).is_playback_active():
                friends_latest_listened.append(
                    {
                        "user": BaseUserSerializer(
                            f, context={"request": request}
                        ).data,
                        "song": CollectionSongRetrieveSerializer(
                            f.streamingprofile.player.current_collection_song,
                            context={"request": request},
                        ).data,
                    }
                )

        return Response(status=status.HTTP_200_OK, data=friends_latest_listened)
