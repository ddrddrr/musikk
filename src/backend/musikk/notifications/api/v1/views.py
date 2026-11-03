from base.openapi import NO_CONTENT_SCHEMA
from django.utils import timezone
from drf_spectacular.utils import extend_schema, inline_serializer
from rest_framework import status
from rest_framework.generics import (
    GenericAPIView,
    get_object_or_404,
)
from rest_framework.response import Response

from notifications.api.v1.serializers import (
    ChatMessageNotificationSerializer,
    FollowerNotificationSerializer,
    ReplyNotificationSerializer,
)
from notifications.models import (
    ChatMessageNotification,
    FollowerNotification,
    ReplyNotification,
)


class NotificationsPersonalListUpdateView(GenericAPIView):
    @extend_schema(
        responses=inline_serializer(
            name="NotificationList",
            fields={
                "replies": ReplyNotificationSerializer(many=True),
                "followers": FollowerNotificationSerializer(many=True),
                "chat_messages": ChatMessageNotificationSerializer(many=True),
            },
        )
    )
    def get(self, request, *args, **kwargs):
        replies = ReplyNotificationSerializer(
            ReplyNotification.objects.exclude(
                reply_publication__author=request.user
            ).filter(orig_publication__author=request.user),
            many=True,
            context={"request": request},
        ).data
        followers = FollowerNotificationSerializer(
            FollowerNotification.objects.filter(receiver=request.user),
            many=True,
            context={"request": request},
        ).data
        chat_messages = ChatMessageNotificationSerializer(
            ChatMessageNotification.objects.filter(receiver=request.user),
            many=True,
            context={"request": request},
        ).data
        return Response(
            {"replies": replies, "followers": followers, "chat_messages": chat_messages}
        )

    @NO_CONTENT_SCHEMA
    def patch(self, request, *args, **kwargs):
        profile = request.user.notificationprofile
        profile.read_at = timezone.now()
        profile.save(update_fields=["read_at"])
        return Response(status=status.HTTP_204_NO_CONTENT)


class NotificationDeleteView(GenericAPIView):
    @NO_CONTENT_SCHEMA
    def delete(self, request, *args, **kwargs):
        user = self.request.user
        notif_uuid = kwargs["uuid"]

        notification = (
            FollowerNotification.objects.filter(receiver=user, uuid=notif_uuid).first()
            or ChatMessageNotification.objects.filter(
                receiver=user, uuid=notif_uuid
            ).first()
            or ReplyNotification.objects.filter(
                orig_publication__author=user, uuid=notif_uuid
            ).first()
        )
        if not notification:
            return Response(status=status.HTTP_404_NOT_FOUND)

        notification.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
