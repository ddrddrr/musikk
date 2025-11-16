from django.db import models

from base.models import BaseModel
from social.models import Publication
from websockets.event_helpers import send_ws_event


class Notification(BaseModel):
    is_read = models.BooleanField(default=False)


class ReplyNotificationManager(models.Manager):
    def create(self, **kwargs):
        obj = super().create(**kwargs)
        send_ws_event(f"user_{obj.orig_comment.user.uuid}", event_handler="base.event", event_name="invalidate.query", query_key=["notifications"])
        return obj


class ReplyNotification(Notification):
    orig_comment = models.ForeignKey(
        Publication, null=True, related_name="+", on_delete=models.SET_NULL
    )
    reply_comment = models.ForeignKey(
        Publication, related_name="+", on_delete=models.CASCADE
    )

    class Meta:
        ordering = ["-date_added"]

    objects = ReplyNotificationManager()


class FriendRequestNotificationManager(models.Manager):
    def create(self, **kwargs):
        obj = super().create(**kwargs)
        send_ws_event(f"user_{obj.receiver.uuid}", event_handler="base.event", event_name="invalidate.query", query_key=["notifications"])
        return obj


class FriendRequestNotification(Notification):
    sender = models.ForeignKey(
        "users.BaseUser", on_delete=models.CASCADE, related_name="+"
    )
    receiver = models.ForeignKey(
        "users.BaseUser", on_delete=models.CASCADE, related_name="+"
    )

    class Meta:
        ordering = ["-date_added"]

    objects = FriendRequestNotificationManager()
