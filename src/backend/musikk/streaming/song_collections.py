from django.db import models

from base.models import BaseModel
from musikk.utils import image_path


class SongCollectionMetadata(BaseModel):
    extras = models.TextField(
        max_length=2048, help_text="Any extra information from the author."
    )


class SongCollection(BaseModel):
    songs = models.ManyToManyField("streaming.BaseSong")
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
