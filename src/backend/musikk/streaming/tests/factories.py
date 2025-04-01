import factory

from base.tests.factories import BaseModelFactory
from streaming.songs import BaseSong
from streaming.song_queue import SongQueue, SongQueueNode

fake = factory.Faker


class BaseSongFactory(BaseModelFactory):
    class Meta:
        model = BaseSong

    title = fake("name")
    description = fake("text")
    mpd = fake("file_path", extension="mpd")
    # image = factory.django.ImageField()
    # metadata = factory.SubFactory()
