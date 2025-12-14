from rest_framework.generics import (
    get_object_or_404,
    RetrieveAPIView,
    RetrieveUpdateAPIView,
)
from rest_framework.views import APIView
from rest_framework import status
from rest_framework.response import Response
from django.views.decorators.csrf import ensure_csrf_cookie
from django.http import HttpResponse

from users.api.v1.serializers import (
    BaseUserSerializer,
    BaseMeSerializer,
    MeUpdateSerializer,
)
from users.models import BaseUser, UserFollow
from users.permissions import IsSelfOrFriend
from websockets.event_helpers import send_ws_event


@ensure_csrf_cookie
def csrf(request):
    return HttpResponse(status=204)


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
        send_ws_event(
            f"user_{self.request.user.uuid}",
            "invalidate.query",
            query_key=["user"],
        )
        return Response(data={"me": BaseMeSerializer(user).data})


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
            data={
                "friends": BaseUserSerializer(
                    user.friends, many=True, context={"request": self.request}
                ).data
            }
        )


class FollowersView(APIView):
    permission_classes = [IsSelfOrFriend]

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

    def post(self, *args, **kwargs):
        follow_user = get_object_or_404(BaseUser, uuid=kwargs["for_user_uuid"])
        UserFollow.objects.get_or_create(
            from_user=self.request.user, to_user=follow_user
        )
        # TODO: friends for both, followers for the other, followed for this
        send_ws_event(
            f"user_{self.request.user.uuid}",
            event_name="invalidate.query",
            query_key=["user", str(self.request.user.uuid), "followed"],
        )
        send_ws_event(
            f"user_{self.request.user.uuid}",
            event_name="invalidate.query",
            query_key=["user", str(self.request.user.uuid), "friends"],
        )
        send_ws_event(
            f"user_{follow_user.uuid}",
            event_name="invalidate.query",
            query_key=["user", str(self.request.user.uuid), "followers"],
        )
        return Response(status=status.HTTP_204_NO_CONTENT)

    def delete(self, *args, **kwargs):
        unfollow_user = get_object_or_404(BaseUser, uuid=kwargs["for_user_uuid"])
        user_connection = get_object_or_404(
            UserFollow, from_user=self.request.user, to_user=unfollow_user
        )
        user_connection.delete()

        send_ws_event(
            f"user_{self.request.user.uuid}",
            event_name="invalidate.query",
            query_key=["user", str(self.request.user.uuid), "followed"],
        )
        send_ws_event(
            f"user_{self.request.user.uuid}",
            event_name="invalidate.query",
            query_key=["user", str(self.request.user.uuid), "friends"],
        )
        send_ws_event(
            f"user_{unfollow_user.uuid}",
            event_name="invalidate.query",
            query_key=["user", str(self.request.user.uuid), "followers"],
        )
        return Response(status=status.HTTP_204_NO_CONTENT)
