import factory

from base.tests.factories import BaseModelFactory
from streaming.models import BaseSong, SongCollection

from streaming.songs import SongCollectionSong

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

        songs_count = kwargs.pop("songs_count", 3)
        songs = extracted or [BaseSongFactory() for _ in range(songs_count)]

        for i, song in enumerate(songs):
            SongCollectionSong.objects.create(
                song=song,
                song_collection=self,
            )
