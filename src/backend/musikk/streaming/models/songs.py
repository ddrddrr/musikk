from base.models import BaseModel
from django.apps import apps
from django.conf import settings
from django.db import models, transaction
from users.models import UserRole
from utils.paths import deafult_image_path
from utils.storage import delete_django_storage_dir


class SongStatus(models.TextChoices):
    QUEUED = "queued", "Queued"
    PROCESSING = "processing", "Processing"
    READY = "ready", "Ready"
    FAILED = "failed", "Failed"


class BaseSongQuerySet(models.QuerySet):
    def published(self):
        return self.filter(status=SongStatus.READY)

    def in_public_published_album(self):
        """
        Songs on at least one public album that is not a draft. Other users
        can only see a song once it is on such an album. `collections.py`
        imports this module, so the collection model comes from the app
        registry instead of an import.
        """
        collection_model = apps.get_model("streaming", "Collection")
        public_albums = collection_model.objects.albums().public().published()
        album_entries = CollectionSong.objects.filter(
            song=models.OuterRef("pk"), collection__in=public_albums
        )
        return self.filter(models.Exists(album_entries))


BaseSongManager = models.Manager.from_queryset(BaseSongQuerySet)


class BaseSong(BaseModel):
    title = models.CharField(max_length=128)
    description = models.TextField(max_length=512, blank=True, default="")
    image = models.ImageField(upload_to=deafult_image_path, null=True, blank=True)
    status = models.CharField(
        max_length=16, choices=SongStatus.choices, default=SongStatus.READY
    )
    status_detail = models.TextField(blank=True, default="")

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
        """
        Removes the packaged audio together with the row. The files go only
        after the commit, so a rolled back delete keeps a playable song.
        """
        content_path = self.content_path
        result = super().delete(using, keep_parents)
        if content_path:
            transaction.on_commit(
                lambda: delete_django_storage_dir(content_path), using=using
            )
        return result

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
    operation_id = models.UUIDField(
        null=True,
        blank=True,
        help_text="Client key of the album upload, so a repeated request finds the same row.",
    )

    class Meta:
        ordering = ("position",)
        constraints = [
            models.UniqueConstraint(
                fields=["collection", "operation_id"],
                name="unique_collection_operation_id",
            )
        ]

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
