from base.openapi import NO_CONTENT_SCHEMA
from django.conf import settings
from django.http import HttpResponse
from django.views.decorators.csrf import ensure_csrf_cookie
from drf_spectacular.utils import extend_schema, extend_schema_view, inline_serializer
from notifications.models import FollowerNotification
from rest_framework import serializers, status
from rest_framework.generics import (
    RetrieveAPIView,
    RetrieveUpdateAPIView,
    get_object_or_404,
)
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from websockets.event_helpers import send_ws_event, user_group

from users.api.v1.serializers import (
    BaseMeSerializer,
    BaseUserSerializer,
    MeUpdateSerializer,
)
from users.models import BaseUser, UserFollow
from users.permissions import IsSelfOrFriend
from users.ws import ServerEvent


# not strictly needed, but already implemented so...
@ensure_csrf_cookie
def csrf(request):
    return HttpResponse(status=204)


def media_access(request):
    """
    Caddy calls this through forward_auth before it serves a file under /media/. Caddy serves
    the file only on a 2xx answer and passes any other answer to the client unchanged. It is a
    plain Django view and not a DRF one, so the API throttles do not count every audio segment.
    """
    if request.user.is_authenticated:
        return HttpResponse(status=204)
    return HttpResponse(status=401)


@extend_schema(
    responses=inline_serializer(
        name="RegistrationSettings",
        fields={"signup_password_required": serializers.BooleanField()},
    )
)
class RegistrationSettingsView(APIView):
    """
    Tells the sign-up form whether to show the sign-up password field. The form
    loads it before anyone has logged in, so it is open to Anonymous Users.
    """

    permission_classes = [AllowAny]

    def get(self, request):
        return Response({"signup_password_required": bool(settings.SIGNUP_PASSWORD)})


ME_UPDATE_SCHEMA = extend_schema(
    responses=inline_serializer(name="MeUpdated", fields={"user": BaseMeSerializer()})
)


@extend_schema_view(
    get=extend_schema(
        responses=inline_serializer(name="Me", fields={"me": BaseMeSerializer()})
    ),
    put=ME_UPDATE_SCHEMA,
    patch=ME_UPDATE_SCHEMA,
)
class MeView(RetrieveUpdateAPIView):
    serializer_class = BaseMeSerializer

    def get_object(self):
        return self.request.user

    def get_serializer_class(self):
        if self.request.method in ("PUT", "PATCH"):
            return MeUpdateSerializer
        return BaseMeSerializer

    def retrieve(self, request, *args, **kwargs):
        return Response(data={"me": self.get_serializer(self.get_object()).data})

    def update(self, request, *args, **kwargs):
        partial = request.method == "PATCH"
        user = self.get_object()
        serializer = self.get_serializer(user, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        user_data = BaseMeSerializer(user).data
        send_ws_event(
            user_group(self.request.user.uuid),
            ServerEvent.USER_UPDATED,
            user=user_data,
        )
        return Response(data={"user": user_data})


class UserRetrieveView(RetrieveAPIView):
    lookup_field = "uuid"
    queryset = BaseUser.objects.all()
    serializer_class = BaseUserSerializer


class FriendsView(APIView):
    permission_classes = [IsSelfOrFriend]

    @extend_schema(
        responses=inline_serializer(
            name="UserFriends", fields={"friends": BaseUserSerializer(many=True)}
        )
    )
    def get(self, *args, **kwargs):
        user = get_object_or_404(BaseUser, uuid=kwargs["for_user_uuid"])
        self.check_object_permissions(self.request, user)
        return Response(
            data={
                "friends": BaseUserSerializer(
                    user.friends, many=True, context={"request": self.request}
                ).data
            }
        )


class FollowersView(APIView):
    permission_classes = [IsSelfOrFriend]

    @extend_schema(
        responses=inline_serializer(
            name="UserFollowers", fields={"followers": BaseUserSerializer(many=True)}
        )
    )
    def get(self, *args, **kwargs):
        user = get_object_or_404(BaseUser, uuid=kwargs["for_user_uuid"])
        self.check_object_permissions(self.request, user)

        qs = BaseUser.objects.filter(followed_users__to_user=user).distinct()
        return Response(
            {
                "followers": BaseUserSerializer(
                    qs, many=True, context={"request": self.request}
                ).data
            }
        )


class FollowedView(APIView):
    permission_classes = [IsSelfOrFriend]

    @extend_schema(
        responses=inline_serializer(
            name="UserFollowed", fields={"followed": BaseUserSerializer(many=True)}
        )
    )
    def get(self, *args, **kwargs):
        user = get_object_or_404(BaseUser, uuid=kwargs["for_user_uuid"])
        self.check_object_permissions(self.request, user)

        qs = BaseUser.objects.filter(followers__from_user=user).distinct()
        return Response(
            {
                "followed": BaseUserSerializer(
                    qs, many=True, context={"request": self.request}
                ).data
            }
        )

    @NO_CONTENT_SCHEMA
    def post(self, *args, **kwargs):
        follow_user = get_object_or_404(BaseUser, uuid=kwargs["for_user_uuid"])
        user_follow, created = UserFollow.objects.get_or_create(
            from_user=self.request.user, to_user=follow_user
        )

        if created:
            FollowerNotification.objects.create(
                sender=self.request.user,
                receiver=follow_user,
            )
            send_ws_event(
                user_group(self.request.user.uuid),
                ServerEvent.USER_FOLLOWED,
                from_uuid=str(self.request.user.uuid),
                to_uuid=str(follow_user.uuid),
            )
            send_ws_event(
                user_group(follow_user.uuid),
                ServerEvent.USER_FOLLOWED,
                from_uuid=str(self.request.user.uuid),
                to_uuid=str(follow_user.uuid),
            )
        return Response(status=status.HTTP_204_NO_CONTENT)

    @NO_CONTENT_SCHEMA
    def delete(self, *args, **kwargs):
        unfollow_user = get_object_or_404(BaseUser, uuid=kwargs["for_user_uuid"])
        user_connection = get_object_or_404(
            UserFollow, from_user=self.request.user, to_user=unfollow_user
        )
        user_connection.delete()

        FollowerNotification.objects.filter(
            sender=self.request.user,
            receiver=unfollow_user,
        ).delete()

        send_ws_event(
            user_group(self.request.user.uuid),
            ServerEvent.USER_UNFOLLOWED,
            from_uuid=str(self.request.user.uuid),
            to_uuid=str(unfollow_user.uuid),
        )
        send_ws_event(
            user_group(unfollow_user.uuid),
            ServerEvent.USER_UNFOLLOWED,
            from_uuid=str(self.request.user.uuid),
            to_uuid=str(unfollow_user.uuid),
        )
        return Response(status=status.HTTP_204_NO_CONTENT)
