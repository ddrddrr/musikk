from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import models

from social.models.user_content import UserContent
from notifications.models import ReplyNotification


class Publication(UserContent):
    parent = models.ForeignKey(
        "self",
        null=True,
        blank=True,
        related_name="replies",
        on_delete=models.SET_NULL,
    )

    created_for_type = models.ForeignKey(
        ContentType,
        on_delete=models.CASCADE,
        help_text="The model for which this Publication is created. Can be SongCollection or User (as in user feed) etc.",
    )
    created_for_id = models.PositiveIntegerField()
    created_for_object = GenericForeignKey("created_for_type", "created_for_id")

    attachment_type = models.ForeignKey(
        ContentType,
        on_delete=models.SET_NULL,
        related_name="attached_to",
        null=True,
        blank=True,
    )
    attachment_id = models.PositiveIntegerField(null=True, blank=True)
    attachment_object = GenericForeignKey("attachment_type", "attachment_id")

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        super().save(*args, **kwargs)
        if is_new and self.parent:
            ReplyNotification.objects.create(
                orig_publication=self.parent,
                reply_publication=self,
            )

    def get_root(self):
        node = self
        while node.parent is not None:
            node = node.parent
        return node

    class Meta(UserContent.Meta):
        db_table = "publications"
        # indexes =
