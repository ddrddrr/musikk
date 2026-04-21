from base.models import BaseModel
from django.conf import settings
from django.db import models
from users.models import UserRole
from utils.paths import deafult_image_path, delete_dir_for_file


class BaseSongQuerySet(models.QuerySet):
    def published(self):
        return self.filter(draft=False)


BaseSongManager = models.Manager.from_queryset(BaseSongQuerySet)


class BaseSong(BaseModel):
    title = models.CharField(max_length=128)
    description = models.TextField(max_length=512, blank=True, default="")
    image = models.ImageField(upload_to=deafult_image_path, null=True, blank=True)
    draft = models.BooleanField(default=False)

    authors = models.ManyToManyField(
        "users.BaseUser",
        through="streaming.SongCredit",
        related_name="authored_songs",
        limit_choices_to={"role": UserRole.ARTIST},
    )

    content_path = models.CharField(
        default="",
        blank=True,
        max_length=settings.MAX_PATH_LENGTH,
        help_text="Path to the directory with all song files.",
    )
    mpd = models.CharField(
        default="",
        blank=True,
        max_length=settings.MAX_PATH_LENGTH,
        help_text="Path to the mpd file representing the song.",
    )
    m3u8 = models.CharField(
        default="",
        blank=True,
        max_length=settings.MAX_PATH_LENGTH,
        help_text="Path to the m3u8 file representing the song.",
    )
    duration_ms = models.IntegerField(null=True, blank=True)

    source_codec = models.CharField(max_length=32, blank=True, default="")
    source_bitrate = models.IntegerField(null=True, blank=True)
    loudness_lufs = models.FloatField(null=True, blank=True)
    true_peak_dbtp = models.FloatField(null=True, blank=True)

    objects = BaseSongManager()

    def delete(self, using=None, keep_parents=False):
        if self.mpd:
            delete_dir_for_file(self.mpd)
        return super().delete(using, keep_parents)

    def is_available(self) -> bool:
        return bool(self.mpd)

    def __str__(self):
        return self.title


class SongCredit(BaseModel):
    song = models.ForeignKey(BaseSong, on_delete=models.CASCADE, related_name="credits")
    author = models.ForeignKey(
        "users.BaseUser",
        null=True,
        on_delete=models.SET_NULL,
        related_name="created_songs",
        limit_choices_to={"role": UserRole.ARTIST},
    )
    author_priority = models.IntegerField(
        default=0, help_text="Priority in which the author will be displayed."
    )

    class Meta:
        ordering = ("author_priority",)


# TODO: if song is in draft state, dont show this somehow
class CollectionSong(BaseModel):
    song = models.ForeignKey(
        BaseSong, on_delete=models.CASCADE, related_name="collectionsongs"
    )
    collection = models.ForeignKey(
        "streaming.Collection",
        on_delete=models.CASCADE,
        blank=False,
        null=True,
        related_name="collectionsongs",
    )
    position = models.IntegerField(
        default=None, null=True, help_text="The position of the song in the collection."
    )

    class Meta:
        ordering = ("position",)

    def save(self, *args, **kwargs):
        if self.position is None and self.collection:
            last = (
                CollectionSong.objects.filter(collection=self.collection)
                .order_by("-position")
                .first()
            )
            self.position = 0 if last is None else (last.position or 0) + 1
        super().save(*args, **kwargs)

    def __str__(self):
        return self.song.title
