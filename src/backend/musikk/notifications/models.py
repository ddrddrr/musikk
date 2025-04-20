from django.db import models
from django_eventstream import send_event

from base.models import BaseModel
from social.models import Comment


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


class ReplyNotificationManager(models.Manager):
    def create(self, **kwargs):
        obj = super().create(**kwargs)
        send_event(f"notifications/events", "message", {"new_reply": ""})
        return obj
