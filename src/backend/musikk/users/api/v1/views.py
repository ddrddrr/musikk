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
from django_eventstream.viewsets import EventsViewSet
from django.views.decorators.csrf import ensure_csrf_cookie
from django.http import HttpResponse

from notifications.models import FriendRequestNotification
from sse.config import EventChannels
from sse.events import Event
from users.api.v1.serializers import (
    BaseUserSerializer,
    BaseProfileSerializer,
)
from users.models import BaseUser, BaseProfile, ArtistProfile, StreamingProfile
from users.permissions import IsProfileOwnerOrReadOnly


@ensure_csrf_cookie
def csrf(request):
    return HttpResponse(status=204)


class UserRetrieveView(RetrieveAPIView):
    lookup_field = "uuid"
    queryset = BaseUser.objects.all()
    serializer_class = BaseUserSerializer
    permission_classes = [IsAuthenticated]


# TODO: improve update view, so that user could change only his credentials
class BaseProfileRetrieveUpdateView(RetrieveUpdateAPIView):
    lookup_field = "uuid"
    queryset = BaseProfile.objects.all()
    serializer_class = BaseProfileSerializer
    permission_classes = [IsAuthenticated, IsProfileOwnerOrReadOnly]

    def perform_update(self, serializer):
        super().perform_update(serializer)
        user_uuid = self.request.user.uuid
        Event.invalidate_event(
            EventChannels.user_events(user_uuid), ["profile", str(user_uuid)]
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
        Event.invalidate_event(
            EventChannels.user_events(user.uuid), ["user", "friends", str(user.uuid)]
        )
        return Response(status=status.HTTP_204_NO_CONTENT)

    def delete(self, request, *args, **kwargs):
        user = get_object_or_404(BaseProfile, uuid=kwargs.get("profile_uuid"))
        friend = get_object_or_404(BaseProfile, uuid=kwargs.get("friend_uuid"))
        user.friends.remove(friend)
        Event.invalidate_event(
            EventChannels.user_events(user.uuid), ["user", "friends", str(user.uuid)]
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
        Event.invalidate_event(
            EventChannels.user_events(user.uuid), ["user", "followed", str(user.uuid)]
        )
        return Response(status=status.HTTP_204_NO_CONTENT)

    def delete(self, request, *args, **kwargs):
        artist = get_object_or_404(BaseProfile, uuid=kwargs.get("uuid"))

        user = self.request.user
        profile: StreamingProfile = user.streamingprofile
        profile.followed.remove(artist)
        Event.invalidate_event(
            EventChannels.user_events(user.uuid), ["user", "followed", str(user.uuid)]
        )
        return Response(status=status.HTTP_204_NO_CONTENT)


class UserEventViewSet(EventsViewSet):
    permission_classes = [IsAuthenticated]

    def list(self, request):
        ch = EventChannels.user_events(self.request.user.uuid)
        # no need to add the channel to the existing list, as it is
        # request scoped, i.e. every user gets its own channel
        self.channels = [ch]
        return super().list(request)
