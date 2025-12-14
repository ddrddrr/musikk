from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from streaming.api.v1.serializers import CollectionSongSerializer
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
                        "song": CollectionSongSerializer(
                            f.song_queue.head.song, context={"request": request}
                        ).data,
                    }
                )

        return Response(status=status.HTTP_200_OK, data=friends_latest_listened)
