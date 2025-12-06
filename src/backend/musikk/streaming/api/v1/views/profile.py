from rest_framework.generics import RetrieveAPIView

from streaming.api.v1.serializers.profile import StreamingProfileGetSerializer
from streaming.models import StreamingProfile


class StreamingProfileRetrieveView(RetrieveAPIView):
    serializer_class = StreamingProfileGetSerializer
    queryset = StreamingProfile.objects.all()

    def get_object(self):
        return self.request.user.streamingprofile
