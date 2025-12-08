from rest_framework.generics import (
    get_object_or_404,
    RetrieveAPIView,
)
from rest_framework.views import APIView
from rest_framework import status
from rest_framework.response import Response
from django.views.decorators.csrf import ensure_csrf_cookie
from django.http import HttpResponse

from users.api.v1.serializers import (
    BaseUserSerializer,
    BaseMeSerializer,
)
from users.models import BaseUser, UserFollow
from users.permissions import IsSelfOrFriend


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


class FriendsView(APIView):
    permission_classes = [IsSelfOrFriend]

    def get(self, *args, **kwargs):
        user = get_object_or_404(BaseUser, uuid=kwargs["for_user_uuid"])
        self.check_object_permissions(self.request, user)
        return Response(
            data={"friends": BaseUserSerializer(user.friends, many=True).data}
        )


class FollowersView(APIView):
    permission_classes = [IsSelfOrFriend]

    def get(self, *args, **kwargs):
        user = get_object_or_404(BaseUser, uuid=kwargs["for_user_uuid"])
        self.check_object_permissions(self.request, user)
        return Response(
            data={"followers": BaseUserSerializer(user.followers, many=True).data}
        )


class FollowedView(APIView):
    permission_classes = [IsSelfOrFriend]

    def get(self, *args, **kwargs):
        user = get_object_or_404(BaseUser, uuid=kwargs["for_user_uuid"])
        self.check_object_permissions(self.request, user)
        return Response(
            data={"followed": BaseUserSerializer(user.followed_users, many=True).data}
        )

    def post(self, *args, **kwargs):
        follow_user = get_object_or_404(BaseUser, uuid=kwargs["user_uuid"])
        UserFollow.objects.create(from_user=self.request.user, to_user=follow_user)
        # TODO: friends for both, followers for the other, followed for this
        # send_ws_event(
        #     f"user_{user.uuid}",
        #     event_handler="base.event",
        #     event_name="invalidate.query",
        #     query_key=["user", "followed", str(user.uuid)],
        # )
        return Response(status=status.HTTP_204_NO_CONTENT)

    def delete(self, *args, **kwargs):
        unfollow_user = get_object_or_404(BaseUser, uuid=kwargs["user_uuid"])
        user_connection = get_object_or_404(
            UserFollow, from_user=self.request.user, to_user=unfollow_user
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
