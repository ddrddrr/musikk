from django.conf import settings
from django.db import models

from base.models import BaseModel


class UserContent(BaseModel):
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="content_objects",
    )
    content = models.CharField(max_length=255)
    is_deleted = models.BooleanField(default=False)

    class Meta:
        abstract = True
        ordering = ("date_added",)

    def delete(self, using=None, keep_parents=False):
        self.is_deleted = True
        self.content = ""
        self.save(update_fields=["is_deleted", "content"])
