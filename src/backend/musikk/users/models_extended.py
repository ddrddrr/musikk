from django.db import models

from users.models import BaseUser


class StreamingUser(BaseUser):
    liked_songs = models.OneToOneField(
        "SongCollection",
        related_name="liked_by",
        on_delete=models.DO_NOTHING,
    )
    followed_song_collections = models.ManyToManyField(
        "SongCollection", related_name="followers"
    )
    created_playlists = models.ManyToManyField("Playlist", related_name="creators")
    song_queue = models.OneToOneField(
        "streaming.models.SongQueue",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="user",
    )


class ContentOwner(models.Model):
    class Meta:
        abstract = True

    owned_songs = models.ManyToManyField("BaseSong", related_name="owners")
    owned_song_collections = models.ManyToManyField(
        "SongCollection", related_name="owners"
    )


class Artist(ContentOwner, StreamingUser):
    bio = models.TextField(max_length=2000)


class Label(ContentOwner, BaseUser):
    artists = models.ManyToManyField("Artist", related_name="labels")
    # TODO: methods which operate over content of all artists under the label
