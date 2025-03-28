from django.conf import settings
from django.db import models

from musikk.models import BaseModel
from musikk.utils import image_path
from streaming.song_collections import SongCollection


class SongMetadata(BaseModel):
    written_by = models.CharField(max_length=64)
    performed_by = models.CharField(max_length=64)
    extras = models.TextField(
        max_length=2000, help_text="Any extra information from the author."
    )


class BaseSong(BaseModel):
    title = models.CharField(max_length=128)
    description = models.TextField(max_length=512, blank=True, default="")
    image = models.ImageField(upload_to=image_path, null=True, blank=True)
    metadata = models.OneToOneField(
        SongMetadata,
        on_delete=models.CASCADE,
        related_name="song",
        null=True,
        blank=True,
    )
    like_count = models.IntegerField(default=0, blank=True)
    dislike_count = models.IntegerField(default=0, blank=True)

    # hashtags = ...

    # TODO: use ffprobe to get it
    duration = models.IntegerField(default=-1, editable=False, blank=True)
    mpd = models.FilePathField(path=settings.AUDIO_CONTENT_PATH, null=True)
    # m3u8 = ...


class SongCollectionSong(BaseModel):
    song = models.ForeignKey(BaseSong, on_delete=models.CASCADE)
    position = models.IntegerField(
        default=None, null=True, help_text="The position of the song."
    )
    song_collection = models.ForeignKey(
        SongCollection, on_delete=models.SET_NULL, blank=False, null=True
    )
    date_added = models.DateTimeField(auto_now_add=True)


