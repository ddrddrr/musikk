import factory

from base.tests.factories import BaseModelFactory
from streaming.models import BaseSong, Collection

from streaming.models.songs import CollectionSong

fake = factory.Faker


class BaseSongFactory(BaseModelFactory):
    class Meta:
        model = BaseSong

    title = fake("name")
    description = fake("paragraph")
    content_path = ""
    mpd = ""
    m3u8 = ""
    image = None
    # metadata = factory.SubFactory()


class CollectionFactory(BaseModelFactory):
    class Meta:
        model = Collection

    type = fake("random_element", elements=["playlist", "album"])
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
            CollectionSong.objects.create(
                song=song,
                collection=self,
            )


class CollectionSongFactory(BaseModelFactory):
    class Meta:
        model = CollectionSong

    song = factory.SubFactory(BaseSongFactory)
    collection = factory.SubFactory(CollectionFactory)
