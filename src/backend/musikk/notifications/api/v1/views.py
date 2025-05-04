from rest_framework.generics import (
    GenericAPIView,
    get_object_or_404,
)
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from notifications.api.v1.serializers import (
    ReplyNotificationSerializer,
    FriendRequestNotificationSerializer,
)
from notifications.models import ReplyNotification, FriendRequestNotification

from users.users_extended import StreamingUser


class NotificationListView(GenericAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = self.request.user.streaminguser
        replies = ReplyNotificationSerializer(
            ReplyNotification.objects.filter(orig_comment__user=user), many=True
        ).data
        friend_requests = FriendRequestNotificationSerializer(
            FriendRequestNotification.objects.filter(receiver=user), many=True
        ).data
        return Response({"replies": replies, "friend_requests": friend_requests})


class ReplyNotificationSetReadView(GenericAPIView):
    permission_classes = [IsAuthenticated]
    queryset = ReplyNotification.objects.all()

    def patch(self, request, *args, **kwargs):
        notif_uuids = self.request.data["uuids"]
        ReplyNotification.objects.filter(uuid__in=notif_uuids).update(is_read=True)
        return Response(status=status.HTTP_204_NO_CONTENT)


class FriendRequestNotificationCreateView(GenericAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        user = self.request.user.streaminguser
        receiver_uuid = self.request.data["uuid"]
        receiver = get_object_or_404(StreamingUser, uuid=receiver_uuid)

        FriendRequestNotification.objects.create(sender=user, receiver=receiver)

        return Response(status=status.HTTP_204_NO_CONTENT)
