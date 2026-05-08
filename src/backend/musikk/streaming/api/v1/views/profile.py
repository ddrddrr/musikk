from rest_framework.generics import RetrieveAPIView
from rest_framework.response import Response
from rest_framework.views import APIView

from streaming.api.v1.serializers.profile import StreamingProfileGetSerializer
from streaming.models import StreamingProfile


class StreamingProfileRetrieveView(RetrieveAPIView):
    serializer_class = StreamingProfileGetSerializer
    queryset = StreamingProfile.objects.all()

    def get_object(self):
        return self.request.user.streamingprofile


class MeLikedSongsView(APIView):
    def get(self, request):
        uuids = request.user.streamingprofile.liked_songs.base_songs.values_list(
            "uuid", flat=True
        )
        return Response({"song_uuids": [str(u) for u in uuids]})


class MeLikedCollectionsView(APIView):
    def get(self, request):
        uuids = request.user.streamingprofile.liked_collections.values_list(
            "uuid", flat=True
        )
        return Response({"collection_uuids": [str(u) for u in uuids]})
