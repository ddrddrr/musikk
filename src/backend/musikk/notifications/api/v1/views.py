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
from notifications.models import (
    ReplyNotification,
    FriendRequestNotification,
    Notification,
)

from users.users_extended import StreamingUser


class NotificationsPersonalListUpdateView(GenericAPIView):
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

    def patch(self, request, *args, **kwargs):
        notif_uuids = self.request.data["uuids"]
        Notification.objects.filter(uuid__in=notif_uuids).update(is_read=True)

        return Response(status=status.HTTP_204_NO_CONTENT)


class NotificationDeleteView(GenericAPIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, *args, **kwargs):
        user = self.request.user.streaminguser
        notif_uuid = kwargs["uuid"]
        # filtering by receiver, so any random user couldn't delete notifications
        # which don't belong to him
        notification = get_object_or_404(
            FriendRequestNotification, receiver=user, uuid=notif_uuid
        )
        notification.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class FriendRequestNotificationCreateView(GenericAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        user = self.request.user.streaminguser
        receiver_uuid = kwargs["uuid"]
        receiver = get_object_or_404(StreamingUser, uuid=receiver_uuid)

        FriendRequestNotification.objects.create(sender=user, receiver=receiver)

        return Response(status=status.HTTP_204_NO_CONTENT)
