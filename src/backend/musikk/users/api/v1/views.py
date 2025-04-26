from django.http import Http404
from rest_framework.generics import RetrieveAPIView, UpdateAPIView, CreateAPIView
from rest_framework.views import APIView
from rest_framework import request
from rest_framework import status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_eventstream.viewsets import EventsViewSet

from sse.config import EventChannels
from users.api.v1.serializers import (
    BaseUserSerializer,
    StreamingUserSerializer,
    ResetPasswordSerializer,
)
from users.user_base import BaseUser
from users.utils import password_reset_token_generator


class BaseUserRetrieveView(RetrieveAPIView):
    lookup_field = "uuid"
    serializer_class = BaseUserSerializer
    queryset = BaseUser.objects.all()


class StreamingUserRetrieveView(RetrieveAPIView):
    lookup_field = "uuid"
    serializer_class = StreamingUserSerializer

    def get_object(self):
        return self.request.user.streaminguser


class UserCreateView(APIView):
    def create(self, request, *args, **kwargs):
        if not request.user.is_anonymous:
            return Response(
                status=status.HTTP_405_METHOD_NOT_ALLOWED,
                data={"error": "Logout before creating a new account."},
            )

        role = request.data["role"]
        user_data = request.data["userData"]
        user = BaseUserSerializer(data=user_data)
        if not user.is_valid():
            return Response(status=status.HTTP_400_BAD_REQUEST, data=user.errors)
        user.save()
        #
        # match role:
        #     case ...


class ResetPasswordView(UpdateAPIView):
    lookup_field = "uuid"
    queryset = BaseUser.objects.all()
    serializer_class = ResetPasswordSerializer
    http_method_names = ["patch"]

    def partial_update(self, request: request.Request, token: str, **kwargs):
        try:
            user = self.get_object()
        except Http404:
            user = None

        if not password_reset_token_generator.check_token(user=user, token=token):
            return Response(
                {"detail": "UUID or token are invalid, or the token is expired."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = self.get_serializer(instance=user, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(status=status.HTTP_204_NO_CONTENT)


class UserEventViewSet(EventsViewSet):
    permission_classes = [IsAuthenticated]

    def list(self, request):
        ch = EventChannels.user_events(self.request.user.uuid)
        # no need to add the channel to the existing list, as it is
        # request scoped, i.e. every user gets its own channel
        self.channels = [ch]
        return super().list(request)
