from django.db import models, transaction
from django.conf import settings

from base.models import BaseModel
from streaming.models import Collection, CollectionCredit, SongQueue
from streaming.models.collections import CollectionType
from streaming.models.song_queue import PlaybackContext, PlayerState


class StreamingProfileManager(models.Manager):
    @transaction.atomic
    def create_for_user(self, user):
        context = PlaybackContext.objects.create()
        song_queue = SongQueue.objects.create()
        player = PlayerState.objects.create(queue=song_queue, context=context)

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

        return self.create(user=user, player=player)


class StreamingProfile(BaseModel):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
    )
    player = models.OneToOneField(
        "streaming.PlayerState",
        on_delete=models.PROTECT,
    )
    followed_collections = models.ManyToManyField(
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
            collection_credits__author=self.user
        ).exclude(type__in=[CollectionType.HISTORY, CollectionType.LIKED])

    objects = StreamingProfileManager()
