from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import models

from base.models import BaseModel


class Stream(BaseModel):
    user = models.ForeignKey(
        "users.StreamingUser", on_delete=models.SET_NULL, null=True
    )

    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    content_objects = GenericForeignKey()
