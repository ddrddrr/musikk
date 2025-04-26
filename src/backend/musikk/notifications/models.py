from django.db import models

from base.models import BaseModel
from social.models import Comment
from sse.config import EventChannels
from sse.events import send_invalidate_event


class ReplyNotificationManager(models.Manager):
    def create(self, **kwargs):
        obj = super().create(**kwargs)
        send_invalidate_event(
            EventChannels.user_events(obj.orig_comment.user.uuid), ["notifications"]
        )
        return obj


class ReplyNotification(BaseModel):
    orig_comment = models.ForeignKey(
        Comment, null=True, related_name="+", on_delete=models.SET_NULL
    )
    reply_comment = models.ForeignKey(
        Comment, related_name="+", on_delete=models.CASCADE
    )
    is_read = models.BooleanField(default=False)

    class Meta:
        ordering = ["-date_added"]

    objects = ReplyNotificationManager()
