from base.serializers import BaseModelSerializer
from notifications.models import ReplyNotification
from social.api.v1.serializers import CommentSerializer


class ReplyNotificationSerializer(BaseModelSerializer):
    orig_comment = CommentSerializer(read_only=True)
    reply_comment = CommentSerializer(read_only=True)

    class Meta(BaseModelSerializer.Meta):
        model = ReplyNotification
        fields = BaseModelSerializer.Meta.fields + [
            "orig_comment",
            "reply_comment",
            "is_read",
        ]
