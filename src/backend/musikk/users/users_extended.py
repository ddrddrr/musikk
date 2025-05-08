from django.db import models

from streaming.models import PlaybackState
from streaming.song_collections import (
    UserHistory,
    LikedSongs,
)
from streaming.song_queue import SongQueue
from users.user_base import BaseUser, UserManager


class StreamingUserManager(UserManager):
    pass


# TODO: set symmetrical false for followers(artist) when added
class StreamingUser(BaseUser):
    friends = models.ManyToManyField("self")
    playback_state = models.OneToOneField(
        "streaming.PlaybackState", on_delete=models.PROTECT
    )

    followed_song_collections = models.ManyToManyField(
        "streaming.SongCollection",
        related_name="followers",
    )
    liked_songs = models.OneToOneField(
        "streaming.LikedSongs",
        related_name="user",
        null=True,
        on_delete=models.PROTECT,
    )
    song_queue = models.OneToOneField(
        "streaming.SongQueue",
        related_name="user",
        null=True,
        on_delete=models.PROTECT,
    )
    history = models.OneToOneField(
        "streaming.UserHistory",
        related_name="user",
        null=True,
        on_delete=models.PROTECT,
    )

    def save(self, *args, **kwargs):
        if not getattr(self, "liked_songs", None):
            self.liked_songs = LikedSongs.objects.create()
        if not getattr(self, "song_queue", None):
            self.song_queue = SongQueue.objects.create()
        if not getattr(self, "history", None):
            self.history = UserHistory.objects.create()
        if not getattr(self, "playback_state", None):
            self.playback_state = PlaybackState.objects.create()

        super().save(*args, **kwargs)

    objects = StreamingUserManager()


class ContentOwner(models.Model):
    class Meta:
        abstract = True

    owned_songs = models.ManyToManyField("streaming.BaseSong")
    owned_song_collections = models.ManyToManyField(
        "streaming.SongCollection",
    )


class ArtistManager(UserManager):
    pass


class Artist(ContentOwner, StreamingUser):
    objects = ArtistManager()


class Label(ContentOwner, BaseUser):
    artists = models.ManyToManyField("users.Artist", related_name="labels")
    # TODO: methods which operate over content of all artists under the label
