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

from notifications.models import FollowerNotification
from websockets.event_helpers import send_ws_event
from users.api.v1.serializers import (
    BaseUserSerializer,
    BaseMeSerializer,
)
from users.models import BaseUser, UserFollow


@ensure_csrf_cookie
def csrf(request):
    return HttpResponse(status=204)


class MeView(APIView):
    def get(self, request, *args, **kwargs):
        return Response(data={"me": BaseMeSerializer(self.request.user).data})


class UserRetrieveView(RetrieveAPIView):
    lookup_field = "uuid"
    queryset = BaseUser.objects.all()
    serializer_class = BaseUserSerializer
    permission_classes = [IsAuthenticated]


class FriendsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, *args, **kwargs):
        user = get_object_or_404(BaseUser, uuid=kwargs["for_user_uuid"])
        if (user is self.request.user) or (user in self.request.user.friends):
            return Response(
                data={
                    "friends": BaseUserSerializer(
                        self.request.user.friends, many=True
                    ).data
                }
            )

        return Response(
            status=status.HTTP_403_FORBIDDEN,
            data={
                "detail": f"Not authorized to see `friends` for user {kwargs["for_user_uuid"]}"
            },
        )


class FollowersView(APIView):
    def get(self, *args, **kwargs):
        user = get_object_or_404(BaseUser, uuid=kwargs["for_user_uuid"])
        if (user is self.request.user) or (user in self.request.user.friends):
            return Response(
                data={
                    "friends": BaseUserSerializer(
                        self.request.user.friends, many=True
                    ).data
                }
            )

        return Response(
            status=status.HTTP_403_FORBIDDEN,
            data={
                "detail": f"Not authorized to see `friend list` for user {kwargs["for_user_uuid"]}"
            },
        )

    def post(self, *args, **kwargs):
        user = self.request.user
        follow_user = get_object_or_404(BaseUser, uuid=kwargs["user_uuid"])
        UserFollow.objects.create(from_user=user, to_user=follow_user)
        # TODO: friends for both, followers for the other, followed for this
        # send_ws_event(
        #     f"user_{user.uuid}",
        #     event_handler="base.event",
        #     event_name="invalidate.query",
        #     query_key=["user", "followed", str(user.uuid)],
        # )
        return Response(status=status.HTTP_204_NO_CONTENT)

    def delete(self, *args, **kwargs):
        user = self.request.user
        unfollow_user = get_object_or_404(BaseUser, uuid=kwargs["user_uuid"])
        user_connection = get_object_or_404(
            UserFollow, from_user=user, to_user=unfollow_user
        )
        user_connection.delete()
        # TODO: friends for both, followers for the other, followed for this
        # send_ws_event(
        #     f"user_{user.uuid}",
        #     event_handler="base.event",
        #     event_name="invalidate.query",
        #     query_key=["user", "followed", str(user.uuid)],
        # )
        return Response(status=status.HTTP_204_NO_CONTENT)
