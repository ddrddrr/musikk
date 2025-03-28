from django.db import models

from musikk.models import BaseModel
from musikk.utils import image_path


class SongCollectionMetadata(BaseModel):
    class Meta:
        abstract = True

    extras = models.TextField(
        max_length=2048, help_text="Any extra information from the author."
    )


class SongCollection(BaseModel):
    class Meta:
        abstract = True

    songs = models.ManyToManyField("streaming.models.BaseSong")
    title = models.CharField(max_length=128)
    description = models.TextField(max_length=512, blank=True, default="")
    image = models.ImageField(upload_to=image_path, null=True, blank=True)
    metadata = models.OneToOneField(
        SongCollectionMetadata, on_delete=models.CASCADE, null=True, blank=True
    )


class Playlist(SongCollection):
    pass


class Album(SongCollection):
    year_released = models.IntegerField(default=None, null=True, blank=True)
