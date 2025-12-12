from django.db import models, transaction
from django.conf import settings


from base.models import BaseModel
from streaming.models import Collection, CollectionCredit, SongQueue
from streaming.models.collections import CollectionType


class StreamingProfileManager(models.Manager):
    @transaction.atomic
    def create_for_user(self, user):
        song_queue = SongQueue.objects.create()

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

        return self.create(user=user, song_queue=song_queue)


class StreamingProfile(BaseModel):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
    )
    song_queue = models.OneToOneField(
        "streaming.SongQueue",
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

    objects = StreamingProfileManager()
