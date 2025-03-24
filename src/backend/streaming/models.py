import os

from django.conf import settings
from django.db import models
from django.db.models import CASCADE


def song_path(instance, filename):
    return os.path.join(settings.MEDIA_ROOT, "songs", "images", str(instance.uuid))


class SongMetadata(models.Model):
    written_by = models.CharField(max_length=64)
    performed_by = models.CharField(max_length=64)
    extras = models.TextField(
        max_length=2000, help_text="Any extra information from the author."
    )


class BaseSong(models.Model):
    title = models.CharField(max_length=64)
    description = models.TextField(max_length=500, blank=True, default="")
    image = models.ImageField(upload_to=song_path, null=True, blank=True)
    metadata = models.OneToOneField(
        SongMetadata, on_delete=CASCADE, null=True, blank=True
    )
    like_count = models.IntegerField(default=0, blank=True)
    dislike_count = models.IntegerField(default=0, blank=True)

    # hashtags = ...

    duration = models.IntegerField(default=-1, editable=False, blank=True)
    mpd = models.FilePathField(path=settings.AUDIO_CONTENT_PATH)
    # m3u8 = ...


class SongCollection(models.Model):
    songs = models.ManyToManyField(BaseSong)
