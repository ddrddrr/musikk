from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import models

from base.models import BaseModel


class HashTag(BaseModel):
    title = models.CharField(max_length=32)

    # INFO: this model is used as a `GenericRelation`
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    content_object = GenericForeignKey()

    class Meta:
        indexes = [
            models.Index(fields=["content_type", "object_id"]),
        ]
