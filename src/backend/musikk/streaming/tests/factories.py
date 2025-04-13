import factory

from base.tests.factories import BaseModelFactory
from streaming.models import BaseSong, SongCollection
from streaming.song_queue import SongQueue, SongQueueNode
import os
import random

fake = factory.Faker


class BaseSongFactory(BaseModelFactory):
    class Meta:
        model = BaseSong

    title = fake("name")
    description = fake("paragraph")
    mpd = ""
    image = None
    # metadata = factory.SubFactory()


class SongCollectionFactory(BaseModelFactory):
    class Meta:
        model = SongCollection

    title = fake("name")
    description = fake("paragraph")
    image = None

    @factory.post_generation
    def songs(self, create, extracted, **kwargs):
        if not create:
            return

        songs_count = kwargs.pop("songs_count", 0)

        if extracted:
            for song in extracted:
                self.songs.add(song)
        else:
            for _ in range(songs_count):
                self.songs.add(BaseSongFactory())
