from base.models import BaseModel
from django.conf import settings
from django.db import models, transaction

from streaming.models.collection_cursor import CollectionCursor
from streaming.models.collections import Collection, CollectionCredit, CollectionType
from streaming.models.playback_queue import PlaybackQueue
from streaming.models.stored_playback_state import StoredPlaybackState


class StreamingProfileManager(models.Manager):
    @transaction.atomic
    def create_for_user(self, user):
        collection_cursor = CollectionCursor.objects.create()
        playback_queue = PlaybackQueue.objects.create()
        stored_playback_state = StoredPlaybackState.objects.create(
            playback_queue=playback_queue, collection_cursor=collection_cursor
        )

        history = Collection.objects.create(
            type=CollectionType.HISTORY,
            title="History",
            private=True,
        )

        liked_songs = Collection.objects.create(
            type=CollectionType.LIKED,
            title="Liked Songs",
            private=True,
        )

        CollectionCredit.objects.create(collection=history, author=user)
        CollectionCredit.objects.create(collection=liked_songs, author=user)

        return self.create(user=user, stored_playback_state=stored_playback_state)


class StreamingProfile(BaseModel):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
    )
    stored_playback_state = models.OneToOneField(
        "streaming.StoredPlaybackState",
        on_delete=models.CASCADE,
    )
    liked_collections = models.ManyToManyField(
        "streaming.Collection",
        related_name="followers",
        blank=True,
    )

    @property
    def history(self):
        return Collection.objects.histories().get(collection_credits__author=self.user)

    @property
    def liked_songs(self):
        return Collection.objects.liked().get(collection_credits__author=self.user)

    @property
    def created_collections(self):
        return Collection.objects.filter(
            collection_credits__author=self.user, draft=False
        ).exclude(type__in=[CollectionType.HISTORY, CollectionType.LIKED])

    objects = StreamingProfileManager()
