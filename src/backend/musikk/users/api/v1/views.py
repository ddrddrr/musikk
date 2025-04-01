from rest_framework.generics import RetrieveAPIView

from users.api.v1.serializers import BaseUserSerializer, StreamingUserSerializer


class BaseUserRetrieveView(RetrieveAPIView):
    serializer_class = BaseUserSerializer

    def get_object(self):
        return self.request.user


class StreamingUserRetrieveView(RetrieveAPIView):
    serializer_class = StreamingUserSerializer

    def get_object(self):
        return self.request.user.streaminguser
