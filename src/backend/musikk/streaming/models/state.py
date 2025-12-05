from django.db import models
from django.conf import settings


from base.models import BaseModel


class StreamingProfile(BaseModel):
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
    followed_collections = models.ManyToManyField(
        "streaming.Collection",
        related_name="followers",
        blank=True,
    )
