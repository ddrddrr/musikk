from django.contrib.contenttypes.fields import GenericRelation
from django.db import models

from base.models import BaseModel
from musikk.utils import image_path
from social.models import Comment
from streaming.stream import Stream
from streaming.songs import SongCollectionSong, BaseSong


class SongCollectionMetadata(BaseModel):
    extras = models.TextField(
        max_length=2048, help_text="Any extra information from the author."
    )


class SongCollection(BaseModel):
    songs = models.ManyToManyField(
        "streaming.BaseSong", through="streaming.SongCollectionSong"
    )
    title = models.CharField(max_length=128)
    description = models.TextField(max_length=512, blank=True, default="")
    image = models.ImageField(upload_to=image_path, null=True, blank=True)
    metadata = models.OneToOneField(
        SongCollectionMetadata, on_delete=models.CASCADE, null=True, blank=True
    )

    streams = GenericRelation(Stream)
    comments = GenericRelation(Comment)

    def ordered_songs(self) -> list[BaseSong]:
        return [
            sc.song
            for sc in SongCollectionSong.objects.filter(song_collection=self)
            .order_by("position")
            .select_related("song")
        ]

    def __str__(self):
        return self.title


class UserHistory(SongCollection):
    def save(self, *args, **kwargs):
        self.title = "history"
        self.description = ""
        self.image = None
        self.metadata = None
        super().save(*args, **kwargs)


class Playlist(SongCollection):
    pass


class Album(SongCollection):
    year_released = models.IntegerField(default=None, null=True, blank=True)
