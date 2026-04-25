from base.models import BaseModel
from django.conf import settings
from django.db import models
from websockets.event_helpers import send_ws_event, user_group

from notifications.ws import ServerEvent


class NotificationProfile(BaseModel):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    read_at = models.DateTimeField(null=True, blank=True)


# TODO: move ws to api layer
class ReplyNotificationManager(models.Manager):
    def create(self, **kwargs):
        obj = super().create(**kwargs)
        send_ws_event(
            user_group(obj.orig_publication.author.uuid),
            ServerEvent.NOTIFICATIONS_CHANGED,
        )
        return obj


class ReplyNotification(BaseModel):
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
            user_group(obj.receiver.uuid),
            ServerEvent.NOTIFICATIONS_CHANGED,
        )
        return obj


class FollowerNotification(BaseModel):
    sender = models.ForeignKey(
        "users.BaseUser", on_delete=models.CASCADE, related_name="+"
    )
    receiver = models.ForeignKey(
        "users.BaseUser", on_delete=models.CASCADE, related_name="+"
    )

    class Meta:
        ordering = ["-date_added"]

    objects = FollowerNotificationManager()


class ChatMessageNotificationManager(models.Manager):
    def create(self, **kwargs):
        obj = super().create(**kwargs)
        send_ws_event(
            user_group(obj.receiver.uuid),
            ServerEvent.NOTIFICATIONS_CHANGED,
        )
        return obj


class ChatMessageNotification(BaseModel):
    message = models.ForeignKey(
        "social.Publication", on_delete=models.CASCADE, related_name="+"
    )
    chat = models.ForeignKey("social.Chat", on_delete=models.CASCADE, related_name="+")
    receiver = models.ForeignKey(
        "users.BaseUser", on_delete=models.CASCADE, related_name="+"
    )

    class Meta:
        ordering = ["-date_added"]

    objects = ChatMessageNotificationManager()
