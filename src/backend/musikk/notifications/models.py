from django.db import models

from base.models import BaseModel
from websockets.event_helpers import send_ws_event


class Notification(BaseModel):
    is_read = models.BooleanField(default=False)


class ReplyNotificationManager(models.Manager):
    def create(self, **kwargs):
        obj = super().create(**kwargs)
        send_ws_event(
            f"user_{obj.orig_publication.author.uuid}",
            event_handler="base.event",
            event_name="invalidate.query",
            query_key=["notifications"],
        )
        return obj


class ReplyNotification(Notification):
    orig_publication = models.ForeignKey(
        "social.Publication", null=True, related_name="+", on_delete=models.SET_NULL
    )
    reply_publication = models.ForeignKey(
        "social.Publication", related_name="+", on_delete=models.CASCADE
    )

    class Meta:
        ordering = ["-date_added"]

    objects = ReplyNotificationManager()


class FollowerNotificationManager(models.Manager):
    def create(self, **kwargs):
        obj = super().create(**kwargs)
        send_ws_event(
            f"user_{obj.receiver.uuid}",
            event_handler="base.event",
            event_name="invalidate.query",
            query_key=["notifications"],
        )
        return obj


class FollowerNotification(Notification):
    sender = models.ForeignKey(
        "users.BaseUser", on_delete=models.CASCADE, related_name="+"
    )
    receiver = models.ForeignKey(
        "users.BaseUser", on_delete=models.CASCADE, related_name="+"
    )

    class Meta:
        ordering = ["-date_added"]

    objects = FollowerNotificationManager()
