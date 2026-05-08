from base.serializers import BaseModelSerializer
from rest_framework import serializers
from social.api.v1.serializers import PublicationRetrieveSerializer
from users.api.v1.serializers import BaseUserSerializer

from notifications.models import (
    ChatMessageNotification,
    FollowerNotification,
    ReplyNotification,
)


class BaseNotificationSerializer(BaseModelSerializer):
    is_read = serializers.SerializerMethodField()

    def get_is_read(self, obj):
        read_at = self.context["request"].user.notificationprofile.read_at
        if read_at is None:
            return False
        return obj.date_added <= read_at

    class Meta(BaseModelSerializer.Meta):
        fields = BaseModelSerializer.Meta.fields + [
            "is_read",
        ]


class ReplyNotificationSerializer(BaseNotificationSerializer):
    orig_publication = PublicationRetrieveSerializer(read_only=True)
    reply_publication = PublicationRetrieveSerializer(read_only=True)

    class Meta(BaseNotificationSerializer.Meta):
        model = ReplyNotification
        fields = BaseNotificationSerializer.Meta.fields + [
            "orig_publication",
            "reply_publication",
        ]


class FollowerNotificationSerializer(BaseNotificationSerializer):
    sender = BaseUserSerializer(read_only=True)
    receiver = BaseUserSerializer(read_only=True)

    class Meta(BaseNotificationSerializer.Meta):
        model = FollowerNotification
        fields = BaseNotificationSerializer.Meta.fields + [
            "sender",
            "receiver",
        ]


class ChatMessageNotificationSerializer(BaseNotificationSerializer):
    message = PublicationRetrieveSerializer(read_only=True)
    receiver = BaseUserSerializer(read_only=True)
    chat_uuid = serializers.UUIDField(source="chat.uuid", read_only=True)
    chat_title = serializers.CharField(source="chat.title", read_only=True)

    class Meta(BaseNotificationSerializer.Meta):
        model = ChatMessageNotification
        fields = BaseNotificationSerializer.Meta.fields + [
            "message",
            "receiver",
            "chat_uuid",
            "chat_title",
        ]
