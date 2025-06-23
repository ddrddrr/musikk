from django.conf import settings
from django.db import models, transaction
from django.utils.crypto import get_random_string

from base.models import BaseModel
from musikk.utils.paths import image_path
from streaming.models import PlaybackState, LikedSongs, SongQueue, UserHistory


def default_display_name():
    return get_random_string(12)


class BaseProfile(BaseModel):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
    )
    display_name = models.CharField(max_length=50, default=default_display_name)
    bio = models.TextField(max_length=2000, blank=True)
    avatar = models.ImageField(
        upload_to=image_path,
        max_length=255,
        blank=True,
        null=True,
    )


# We do this to avoid creating profiles which may not be used
# and otherwise would be wasting space
class StreamingProfileManager(models.Manager):
    def for_user(self, user):
        try:
            return self.get(user=user)
        except StreamingProfile.DoesNotExist:
            with transaction.atomic():
                ps = PlaybackState.objects.create()
                ls = LikedSongs.objects.create()
                sq = SongQueue.objects.create()
                uh = UserHistory.objects.create()
                return StreamingProfile.objects.create(
                    user=user,
                    playback_state=ps,
                    liked_songs=ls,
                    song_queue=sq,
                    history=uh,
                )


class StreamingProfile(BaseModel):
    """
    `playback_state`, `liked_songs`, `song_queue` and `history`
    are created in a signal.
    """

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
    )
    playback_state = models.OneToOneField(
        "streaming.PlaybackState",
        on_delete=models.PROTECT,
    )
    liked_songs = models.OneToOneField(
        "streaming.LikedSongs",
        on_delete=models.PROTECT,
    )
    song_queue = models.OneToOneField(
        "streaming.SongQueue",
        on_delete=models.PROTECT,
    )
    history = models.OneToOneField(
        "streaming.UserHistory",
        on_delete=models.PROTECT,
    )
    friends = models.ManyToManyField("users.BaseProfile", blank=True)
    followed = models.ManyToManyField(
        "users.BaseProfile",
        related_name="followers",
        blank=True,
    )
    followed_collections = models.ManyToManyField(
        "streaming.Collection",
        related_name="followers",
        blank=True,
    )

    objects = StreamingProfileManager()


class ArtistProfileManager(models.Manager):
    def for_user(self, user):
        try:
            return self.get(user=user)
        except ArtistProfile.DoesNotExist:
            return ArtistProfile.objects.create(
                user=user,
            )


class ArtistProfile(BaseModel):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
    )

    objects = ArtistProfileManager()


# TODO: add contentowner, label etc.
