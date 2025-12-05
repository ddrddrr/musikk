from django.db import models

from base.models import BaseModel
from musikk.utils.paths import image_path

from streaming.models.songs import CollectionSong, BaseSong


# TODO: add metadata, streams, hashtags, ratings
class Collection(BaseModel):
    base_songs = models.ManyToManyField(
        "streaming.BaseSong",
        through="streaming.CollectionSong",
    )
    title = models.CharField(max_length=128)
    description = models.TextField(max_length=512, blank=True, default="")
    image = models.ImageField(upload_to=image_path, null=True, blank=True)
    private = models.BooleanField(default=False)

    authors = models.ManyToManyField(
        "users.BaseUser",
        through="streaming.CollectionCredit",
    )

    def ordered_songs(self) -> list[BaseSong]:
        return [
            sc.song
            for sc in CollectionSong.objects.filter(collection=self)
            .order_by("position")
            .select_related("song")
        ]

    def __str__(self):
        return self.title


class Album(Collection):
    authors = models.ManyToManyField(
        "users.Artist",
        through="streaming.CollectionCredit",
    )


class UserHistory(Collection):
    def save(self, *args, **kwargs):
        self.title = "History"
        super().save(*args, **kwargs)

    class Meta:
        ordering = ("-date_added",)


class LikedSongs(Collection):
    def save(self, *args, **kwargs):
        self.title = "Liked Songs"
        super().save(*args, **kwargs)

    class Meta:
        ordering = ("-date_added",)


class CollectionCredit(BaseModel):
    collection = models.ForeignKey(
        Collection, on_delete=models.CASCADE, related_name="collection_credits"
    )
    author = models.ForeignKey(
        "users.BaseUser",
        null=True,
        on_delete=models.SET_NULL,
        related_name="collection_credits",
    )
    author_priority = models.IntegerField(
        default=0, help_text="Priority in which the authors will be displayed."
    )

    class Meta:
        ordering = ("author_priority",)
