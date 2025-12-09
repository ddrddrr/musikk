from rest_framework import serializers

from base.serializers import BaseModelSerializer
from notifications.models import ReplyNotification, FollowerNotification
from social.api.v1.serializers import PublicationRetrieveSerializer


class BaseNotificationSerializer(BaseModelSerializer):
    is_read = serializers.BooleanField(default=False)

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
            "is_read",
        ]
