from django.conf import settings
from django.db import models

from base.models import BaseModel
from musikk.utils import image_path, delete_dir_for_file


class SongMetadata(BaseModel):
    written_by = models.CharField(max_length=64)
    performed_by = models.CharField(max_length=64)
    extras = models.TextField(
        max_length=2000, help_text="Any extra information from the author."
    )


# TODO: add hashtags
class BaseSong(BaseModel):
    title = models.CharField(max_length=128)
    description = models.TextField(max_length=512, blank=True, default="")
    image = models.ImageField(upload_to=image_path, null=True, blank=True)
    metadata = models.OneToOneField(
        SongMetadata,
        on_delete=models.SET_NULL,
        related_name="song",
        null=True,
        blank=True,
    )
    like_count = models.IntegerField(default=0, blank=True)
    dislike_count = models.IntegerField(default=0, blank=True)

    # hashtags = ...

    mpd = models.CharField(
        default="",
        blank=True,
        max_length=settings.MAX_PATH_LENGTH,
        help_text="Path to the mpd file representing the song.",
        # TODO: uncomment when figured out how to show in change template in admin
        # editable=False,
    )

    def delete(self, using=None, keep_parents=False):
        if self.mpd:
            delete_dir_for_file(self.mpd)
        return super().delete(using, keep_parents)

    def is_available(self) -> bool:
        return self.mpd is not None

    # m3u8 = ...

    def __str__(self):
        return self.title


class SongCollectionSong(BaseModel):
    song = models.ForeignKey(BaseSong, on_delete=models.CASCADE)
    song_collection = models.ForeignKey(
        "streaming.SongCollection", on_delete=models.CASCADE, blank=False, null=True
    )
    position = models.IntegerField(
        default=None, null=True, help_text="The order of the song in the collection."
    )

    def __str__(self):
        return self.song.title
