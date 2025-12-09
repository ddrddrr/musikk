from rest_framework.generics import (
    GenericAPIView,
    get_object_or_404,
)
from rest_framework.response import Response
from rest_framework import status

from notifications.api.v1.serializers import (
    ReplyNotificationSerializer,
)
from notifications.models import (
    ReplyNotification,
    FollowerNotification,
    Notification,
)
from users.models import BaseUser


class NotificationsPersonalListUpdateView(GenericAPIView):
    def get(self, request, *args, **kwargs):
        user = self.request.user

        replies = ReplyNotificationSerializer(
            ReplyNotification.objects.filter(orig_publication__author=user), many=True
        ).data
        return Response({"replies": replies})

    def patch(self, request, *args, **kwargs):
        notif_uuids = self.request.data["uuids"]
        Notification.objects.filter(uuid__in=notif_uuids).update(is_read=True)

        return Response(status=status.HTTP_204_NO_CONTENT)


class NotificationDeleteView(GenericAPIView):
    def delete(self, request, *args, **kwargs):
        user = self.request.user
        notif_uuid = kwargs["uuid"]
        # filtering by receiver, so any random user couldn't delete notifications
        # which don't belong to him
        notification = get_object_or_404(
            FollowerNotification, receiver=user, uuid=notif_uuid
        )
        notification.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
