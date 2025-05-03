from django.contrib.auth.base_user import BaseUserManager
from django.db import models

from streaming.song_collections import (
    UserHistory,
    LikedSongs,
    SongCollectionAuthor,
)
from streaming.song_queue import SongQueue
from users.user_base import BaseUser, UserManager


class StreamingUserManager(UserManager):
    pass


class StreamingUser(BaseUser):
    # TODO: add method to initialize liked_songs
    liked_songs = models.OneToOneField(
        "streaming.LikedSongs",
        related_name="liked_by",
        null=True,
        on_delete=models.SET_NULL,
    )
    followed_song_collections = models.ManyToManyField(
        "streaming.SongCollection",
        related_name="followers",
    )
    song_queue = models.OneToOneField(
        "streaming.SongQueue",
        related_name="user",
        null=True,
        on_delete=models.DO_NOTHING,
    )
    history = models.OneToOneField(
        "streaming.UserHistory",
        related_name="user",
        null=True,
        on_delete=models.DO_NOTHING,
    )

    def save(self, *args, **kwargs):
        if not self.liked_songs:
            self.liked_songs = LikedSongs.objects.create()
        if not self.song_queue:
            self.song_queue = SongQueue.objects.create()
        if not self.history:
            self.history = UserHistory.objects.create()
        super().save(*args, **kwargs)
        SongCollectionAuthor.objects.create(
            song_collection=self.liked_songs, author=self
        )

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
