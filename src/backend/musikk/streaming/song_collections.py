from django.contrib.contenttypes.fields import GenericRelation
from django.db import models

from base.models import BaseModel
from musikk.utils import image_path
from social.models import Publication
from streaming.stream import Stream
from streaming.songs import SongCollectionSong, BaseSong


class SongCollectionMetadata(BaseModel):
    extras = models.TextField(
        max_length=2048, help_text="Any extra information from the author."
    )


class SongCollection(BaseModel):
    class CollectionType(models.TextChoices):
        PLAYLIST = "playlist", "Playlist"
        ALBUM = "album", "Album"

    type = models.CharField(choices=CollectionType.choices)
    songs = models.ManyToManyField(
        "streaming.BaseSong", through="streaming.SongCollectionSong"
    )
    title = models.CharField(max_length=128)
    description = models.TextField(max_length=512, blank=True, default="")
    image = models.ImageField(upload_to=image_path, null=True, blank=True)
    metadata = models.OneToOneField(
        SongCollectionMetadata, on_delete=models.CASCADE, null=True, blank=True
    )
    private = models.BooleanField(default=False)

    authors = models.ManyToManyField(
        "users.StreamingUser", through="streaming.SongCollectionAuthor"
    )
    streams = GenericRelation(Stream)
    comments = GenericRelation(Publication, limit_choices_to={"type": "comment"})

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
        self.title = "History"
        self.description = ""
        self.image = None
        self.metadata = None
        self.private = True
        super().save(*args, **kwargs)


class LikedSongs(SongCollection):
    def save(self, *args, **kwargs):
        self.title = "Liked Songs"
        self.description = ""
        self.image = None
        self.metadata = None
        self.private = True
        super().save(*args, **kwargs)


class SongCollectionAuthor(BaseModel):
    song_collection = models.ForeignKey(
        SongCollection, on_delete=models.CASCADE, related_name="author_links"
    )
    author = models.ForeignKey(
        "users.StreamingUser",
        null=True,
        on_delete=models.SET_NULL,
        related_name="authored_collections_link",
    )
    author_priority = models.IntegerField(
        default=0, help_text="Priority in which the authors will be displayed."
    )

    class Meta:
        ordering = ("author_priority",)
