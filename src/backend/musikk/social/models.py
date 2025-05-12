from uuid import UUID

from django.apps import apps
from django.conf import settings
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import ValidationError
from django.db import models

from base.models import BaseModel


def on_content_type_delete(collector, field, sub_objs, using):
    for publication in sub_objs:
        if publication.type == Publication.PublicationType.COMMENT:
            publication.is_deleted = True
            publication.content = ""
            publication.save()
        else:
            publication.content_type = None
            publication.object_id = None
            publication.content_object = None
            publication.save()


class Publication(BaseModel):
    class PublicationType(models.TextChoices):
        COMMENT = "comment", "Comment"  # on collections
        POST = "post", "Post"  # user feed

    RELATED_MODEL_TYPE_MAP = {
        "user": "users.StreamingUser",
        "collection": "streaming.SongCollection",
        "song": "streaming.SongCollectionSong",
    }

    type = models.CharField(choices=PublicationType.choices)
    content = models.CharField(max_length=255)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL
    )
    parent = models.ForeignKey(
        "self", null=True, blank=True, related_name="replies", on_delete=models.SET_NULL
    )
    is_deleted = models.BooleanField(default=False)

    content_type = models.ForeignKey(
        ContentType, null=True, blank=True, on_delete=on_content_type_delete
    )
    object_id = models.PositiveIntegerField(null=True, blank=True)
    content_object = GenericForeignKey()

    class Meta:
        ordering = ("date_added",)

    def delete(self, using=None, keep_parents=False):
        self.is_deleted = True
        self.content = ""
        self.save()

    def get_root(self):
        post = self
        while post.parent is not None:
            post = post.parent

        return post

    @classmethod
    def get_model_from_type(cls, obj_type: str):
        try:
            return apps.get_model(cls.RELATED_MODEL_TYPE_MAP[obj_type])
        except KeyError:
            raise ValidationError(f"Invalid obj_type provided: {obj_type}")

    @classmethod
    def get_type_from_model(cls, obj) -> str | None:
        model_label = f"{obj._meta.app_label}.{obj.__class__.__name__}"
        return next(
            (
                key
                for key, value in cls.RELATED_MODEL_TYPE_MAP.items()
                if value == model_label
            ),
            None,
        )

    @staticmethod
    def lookup_related_instance(obj_type: str, obj_uuid: str | UUID):
        model = Publication.get_model_from_type(obj_type)
        try:
            return model.objects.get(uuid=obj_uuid)
        except model.DoesNotExist:
            raise ValidationError(f"No object found with uuid: {obj_uuid}")
