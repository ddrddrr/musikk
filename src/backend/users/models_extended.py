from django.db import models

from src.backend.users.models_base import BaseUser


class StreamingUser(BaseUser):
    liked_songs = models.OneToOneField(
        "SongCollection",
        related_name="+",
        on_delete=models.DO_NOTHING,
    )
    followed_song_collections = models.ManyToManyField(
        "SongCollection", related_name="followers"
    )
    created_playlists = models.ManyToManyField(
        "SongCollection", related_name="creators"
    )
    song_queue = ...


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
    pass
