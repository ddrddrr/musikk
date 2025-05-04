from rest_framework import serializers

from base.serializers import BaseModelSerializer
from notifications.models import ReplyNotification, FriendRequestNotification
from social.api.v1.serializers import CommentRetrieveSerializer


class ReplyNotificationSerializer(BaseModelSerializer):
    orig_comment = CommentRetrieveSerializer(read_only=True)
    reply_comment = CommentRetrieveSerializer(read_only=True)

    class Meta(BaseModelSerializer.Meta):
        model = ReplyNotification
        fields = BaseModelSerializer.Meta.fields + [
            "orig_comment",
            "reply_comment",
            "is_read",
        ]


class FriendRequestNotificationSerializer(BaseModelSerializer):
    sender = serializers.SerializerMethodField()
    receiver = serializers.SerializerMethodField()

    class Meta(BaseModelSerializer.Meta):
        model = FriendRequestNotification
        fields = BaseModelSerializer.Meta.fields + ["sender", "receiver"]

    def get_sender(self, obj):
        return {"uuid": obj.sender.uuid, "display_name": obj.sender.display_name}

    def get_receiver(self, obj):
        return {"uuid": obj.receiver.uuid, "display_name": obj.receiver.display_name}
