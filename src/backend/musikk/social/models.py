from uuid import UUID

from django.apps import apps
from django.conf import settings
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import ValidationError
from django.db import models

from base.models import BaseModel


class Comment(BaseModel):
    AvailableModelsMap = {
        "collection": "streaming.SongCollection",
        "song": "streaming.BaseSong",
    }

    content = models.CharField(max_length=255)
    # TODO: change cascade to set default
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL
    )
    parent = models.ForeignKey(
        "self", null=True, blank=True, related_name="replies", on_delete=models.CASCADE
    )
    is_deleted = models.BooleanField(default=False)

    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    content_object = GenericForeignKey()

    class Meta:
        ordering = ("date_added",)

    def delete(self, using=None, keep_parents=False):
        self.is_deleted = True
        self.content = ""
        self.save()

    @staticmethod
    def lookup_related_instance(obj_type: str, obj_uuid: str | UUID):
        if not (model := Comment.AvailableModelsMap.get(obj_type)):
            raise ValidationError(f"Invalid obj_type provided: {obj_type}")
        model = apps.get_model(model)
        try:
            obj = model.objects.get(uuid=obj_uuid)
        except model.DoesNotExist:
            raise ValidationError(f"No object found with uuid: {obj_uuid}")
        return obj
