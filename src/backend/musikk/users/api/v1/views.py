from django.http import Http404
from rest_framework.generics import (
    RetrieveAPIView,
    UpdateAPIView,
    CreateAPIView,
    RetrieveUpdateAPIView,
    get_object_or_404,
)
from rest_framework.views import APIView
from rest_framework import request, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.mixins import ListModelMixin
from django_eventstream.viewsets import EventsViewSet

from notifications.api.v1.serializers import FriendRequestNotificationSerializer
from notifications.models import FriendRequestNotification
from sse.config import EventChannels
from sse.events import send_invalidate_event
from users.api.v1.serializers_base import (
    BaseUserSerializer,
    ResetPasswordSerializer,
)
from users.api.v1.serializers_extended import (
    StreamingUserCreateSerializer,
    ArtistCreateSerializer,
)
from users.user_base import BaseUser
from users.users_extended import StreamingUser
from users.utils import password_reset_token_generator


class UserRetrieveUpdateView(RetrieveUpdateAPIView):
    lookup_field = "uuid"
    queryset = BaseUser.objects.all()
    serializer_class = BaseUserSerializer
    permission_classes = [IsAuthenticated]

    def perform_update(self, serializer):
        super().perform_update(serializer)
        user_uuid = self.request.user.uuid
        send_invalidate_event(
            EventChannels.user_events(user_uuid), ["user", str(user_uuid)]
        )


class UserCreateView(APIView):
    def post(self, request, *args, **kwargs):
        if not request.user.is_anonymous:
            return Response(
                status=status.HTTP_403_FORBIDDEN,
                data={"error": "Logout before creating a new account."},
            )

        user_role = request.data.pop("userRole")
        match user_role:
            case "StreamingUser":
                s = StreamingUserCreateSerializer(data=request.data)
            case "Artist":
                s = ArtistCreateSerializer(data=request.data)
            case _:
                return Response(
                    status=status.HTTP_400_BAD_REQUEST,
                    data={"error": f"Invalid user role {user_role}."},
                )

        if not s.is_valid():
            return Response(status=status.HTTP_400_BAD_REQUEST, data=s.errors)
        s.save()
        return Response(status=status.HTTP_201_CREATED)


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


class UserFriendsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user.streaminguser
        friends = BaseUserSerializer(user.friends.all(), many=True).data
        return Response(status=status.HTTP_200_OK, data={"friends": friends})


class UserFriendsAcceptView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        user = request.user.streaminguser
        sender_uuid = kwargs.get("uuid")
        sender = get_object_or_404(StreamingUser, uuid=sender_uuid)
        get_object_or_404(
            FriendRequestNotification,
            sender=sender,
            receiver=user,
        )
        user.friends.add(sender)
        return Response(status=status.HTTP_204_NO_CONTENT)


class UserEventViewSet(EventsViewSet):
    permission_classes = [IsAuthenticated]

    def list(self, request):
        ch = EventChannels.user_events(self.request.user.uuid)
        # no need to add the channel to the existing list, as it is
        # request scoped, i.e. every user gets its own channel
        self.channels = [ch]
        return super().list(request)
