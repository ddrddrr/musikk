from django.db import models

from users.base_user import BaseUser


class StreamingUser(BaseUser):
    # TODO: add method to initialize liked_songs
    liked_songs = models.OneToOneField(
        "streaming.SongCollection",
        related_name="liked_by",
        null=True,
        on_delete=models.SET_NULL,
    )
    followed_song_collections = models.ManyToManyField(
        "streaming.SongCollection",
        related_name="followers",
    )
    created_playlists = models.ManyToManyField(
        "streaming.Playlist",
        related_name="creators",
    )
    song_queue = models.OneToOneField(
        "streaming.SongQueue",
        related_name="user",
        null=True,
        on_delete=models.SET_NULL,
    )


class ContentOwner(models.Model):
    class Meta:
        abstract = True

    owned_songs = models.ManyToManyField("streaming.BaseSong")
    owned_song_collections = models.ManyToManyField(
        "streaming.SongCollection",
    )


class Artist(ContentOwner, StreamingUser):
    bio = models.TextField(max_length=2000)


class Label(ContentOwner, BaseUser):
    artists = models.ManyToManyField("users.Artist", related_name="labels")
    # TODO: methods which operate over content of all artists under the label
