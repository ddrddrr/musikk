from rest_framework.generics import (
    RetrieveUpdateAPIView,
    get_object_or_404,
    RetrieveAPIView,
    ListAPIView,
)
from rest_framework.views import APIView
from rest_framework import status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.views.decorators.csrf import ensure_csrf_cookie
from django.http import HttpResponse

from notifications.models import FriendRequestNotification
from websockets.event_helpers import send_ws_event
from users.api.v1.serializers import (
    BaseUserSerializer,
    BaseProfileSerializer,
)
from users.models import BaseUser, BaseProfile, ArtistProfile, StreamingProfile
from users.permissions import IsProfileOwnerOrReadOnly


@ensure_csrf_cookie
def csrf(request):
    return HttpResponse(status=204)


class MeView(APIView):
    def get(self, request, *args, **kwargs):
        return Response(data={"me": BaseUserSerializer(self.request.user).data})


# TODO: this is probably not needed anymore, remove
class UserRetrieveView(RetrieveAPIView):
    lookup_field = "uuid"
    queryset = BaseUser.objects.all()
    serializer_class = BaseUserSerializer
    permission_classes = [IsAuthenticated]


class BaseProfileRetrieveUpdateView(RetrieveUpdateAPIView):
    lookup_field = "uuid"
    queryset = BaseProfile.objects.all()
    serializer_class = BaseProfileSerializer
    permission_classes = [IsAuthenticated, IsProfileOwnerOrReadOnly]

    def perform_update(self, serializer):
        super().perform_update(serializer)
        user_uuid = self.request.user.uuid
        send_ws_event(
            f"user_{user_uuid}",
            event_handler="base.event",
            event_name="invalidate.query",
            query_key=["profile", str(user_uuid)],
        )


class FriendsListView(ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = BaseProfileSerializer

    def get_queryset(self):
        profile = get_object_or_404(BaseProfile, uuid=self.kwargs["uuid"])
        return profile.friends.all()


class FollowedListView(ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = BaseProfileSerializer

    def get_queryset(self):
        profile = get_object_or_404(BaseProfile, uuid=self.kwargs["uuid"])
        return profile.followed.all()


class UserFriendsView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        user = get_object_or_404(BaseProfile, uuid=kwargs.get("profile_uuid"))
        friend = get_object_or_404(BaseProfile, uuid=kwargs.get("friend_uuid"))
        # can't add a friend, if there was no prior request
        get_object_or_404(
            FriendRequestNotification,
            sender=friend,
            receiver=user,
        )
        user.friends.add(friend)
        send_ws_event(
            f"user_{user.uuid}",
            event_handler="base.event",
            event_name="invalidate.query",
            query_key=["user", "friends", str(user.uuid)],
        )
        return Response(status=status.HTTP_204_NO_CONTENT)

    def delete(self, request, *args, **kwargs):
        user = get_object_or_404(BaseProfile, uuid=kwargs.get("profile_uuid"))
        friend = get_object_or_404(BaseProfile, uuid=kwargs.get("friend_uuid"))
        user.friends.remove(friend)
        send_ws_event(
            f"user_{user.uuid}",
            event_handler="base.event",
            event_name="invalidate.query",
            query_key=["user", "friends", str(user.uuid)],
        )
        return Response(status=status.HTTP_204_NO_CONTENT)


class ArtistFollowersView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        profile: ArtistProfile = self.request.user.artistprofile
        followers = BaseProfileSerializer(
            profile.followers.all(), many=True, context={"request": request}
        ).data
        return Response(status=status.HTTP_200_OK, data=followers)

    def post(self, request, *args, **kwargs):
        # TODO: add check that this is actually an artist
        artist = get_object_or_404(BaseProfile, uuid=kwargs.get("uuid"))

        user = self.request.user
        profile: StreamingProfile = user.streamingprofile
        profile.followed.add(artist)
        send_ws_event(
            f"user_{user.uuid}",
            event_handler="base.event",
            event_name="invalidate.query",
            query_key=["user", "followed", str(user.uuid)],
        )
        return Response(status=status.HTTP_204_NO_CONTENT)

    def delete(self, request, *args, **kwargs):
        artist = get_object_or_404(BaseProfile, uuid=kwargs.get("uuid"))

        user = self.request.user
        profile: StreamingProfile = user.streamingprofile
        profile.followed.remove(artist)
        send_ws_event(
            f"user_{user.uuid}",
            event_handler="base.event",
            event_name="invalidate.query",
            query_key=["user", "followed", str(user.uuid)],
        )
        return Response(status=status.HTTP_204_NO_CONTENT)
