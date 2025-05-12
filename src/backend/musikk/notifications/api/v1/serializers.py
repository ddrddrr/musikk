from rest_framework import serializers

from base.serializers import BaseModelSerializer
from notifications.models import ReplyNotification, FriendRequestNotification
from social.api.v1.serializers import PublicationRetrieveSerializer


class BaseNotificationSerializer(BaseModelSerializer):
    is_read = serializers.BooleanField(default=False)

    class Meta(BaseModelSerializer.Meta):
        fields = BaseModelSerializer.Meta.fields + [
            "is_read",
        ]


class ReplyNotificationSerializer(BaseNotificationSerializer):
    orig_comment = PublicationRetrieveSerializer(read_only=True)
    reply_comment = PublicationRetrieveSerializer(read_only=True)

    class Meta(BaseNotificationSerializer.Meta):
        model = ReplyNotification
        fields = BaseNotificationSerializer.Meta.fields + [
            "orig_comment",
            "reply_comment",
            "is_read",
        ]


class FriendRequestNotificationSerializer(BaseNotificationSerializer):
    sender = serializers.SerializerMethodField()
    receiver = serializers.SerializerMethodField()

    class Meta(BaseNotificationSerializer.Meta):
        model = FriendRequestNotification
        fields = BaseNotificationSerializer.Meta.fields + ["sender", "receiver"]

    def get_sender(self, obj):
        return {"uuid": obj.sender.uuid, "display_name": obj.sender.display_name}

    def get_receiver(self, obj):
        return {"uuid": obj.receiver.uuid, "display_name": obj.receiver.display_name}
