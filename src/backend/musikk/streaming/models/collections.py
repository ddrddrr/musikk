from django.db import models

from base.models import BaseModel
from musikk.utils.paths import DEFAULT_IMAGE_PATH
from streaming.models.songs import CollectionSong, BaseSong


class CollectionType(models.TextChoices):
    PLAYLIST = "playlist", "Playlist"
    ALBUM = "album", "Album"
    HISTORY = "history", "History"
    LIKED = "liked", "Liked songs"


class CollectionQuerySet(models.QuerySet):
    def playlists(self):
        return self.filter(type=CollectionType.PLAYLIST)

    def albums(self):
        return self.filter(type=CollectionType.ALBUM)

    def histories(self):
        return self.filter(type=CollectionType.HISTORY)

    def liked(self):
        return self.filter(type=CollectionType.LIKED)

    def public(self):
        return self.filter(private=False)


CollectionManager = models.Manager.from_queryset(CollectionQuerySet)


class Collection(BaseModel):
    type = models.CharField(
        max_length=16,
        choices=CollectionType.choices,
        default=CollectionType.PLAYLIST,
    )

    base_songs = models.ManyToManyField(
        "streaming.BaseSong",
        through="streaming.CollectionSong",
    )
    title = models.CharField(max_length=128)
    description = models.TextField(max_length=512, blank=True, default="")
    image = models.ImageField(upload_to=DEFAULT_IMAGE_PATH, null=True, blank=True)
    private = models.BooleanField(default=False)

    authors = models.ManyToManyField(
        "users.BaseUser",
        through="streaming.CollectionCredit",
        related_name="collections",
    )

    objects = CollectionManager()

    def ordered_songs(self) -> list[BaseSong]:
        return [
            sc.song
            for sc in (
                CollectionSong.objects.filter(collection=self)
                .order_by("position")
                .select_related("song")
            )
        ]

    class Meta:
        ordering = ("-date_added",)

    def __str__(self):
        return self.title


class CollectionCredit(BaseModel):
    collection = models.ForeignKey(
        Collection,
        on_delete=models.CASCADE,
        related_name="collection_credits",
    )
    author = models.ForeignKey(
        "users.BaseUser",
        null=True,
        on_delete=models.SET_NULL,
        related_name="collection_credits",
    )
    author_priority = models.IntegerField(
        default=0,
        help_text="Priority in which the authors will be displayed.",
    )

    class Meta:
        ordering = ("author_priority",)

    def __str__(self):
        return f"{self.collection}: {self.author}"
