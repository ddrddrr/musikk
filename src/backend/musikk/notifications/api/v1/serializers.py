from base.serializers import BaseModelSerializer
from notifications.models import ReplyNotification
from social.api.v1.serializers import CommentReadSerializer


class ReplyNotificationSerializer(BaseModelSerializer):
    orig_comment = CommentReadSerializer(read_only=True)
    reply_comment = CommentReadSerializer(read_only=True)

    class Meta(BaseModelSerializer.Meta):
        model = ReplyNotification
        fields = BaseModelSerializer.Meta.fields + [
            "orig_comment",
            "reply_comment",
            "is_read",
        ]
