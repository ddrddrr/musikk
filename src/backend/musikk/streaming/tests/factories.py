import factory

from base.tests.factories import BaseModelFactory
from streaming.models import BaseSong, Collection, SongQueue
from streaming.models.song_queue import PlaybackContext, PlayerState
from streaming.models.songs import CollectionSong, SongCredit
from users.tests.factories import ArtistFactory

fake = factory.Faker


class BaseSongFactory(BaseModelFactory):
    class Meta:
        model = BaseSong

    title = fake("name")
    description = fake("paragraph")
    content_path = ""
    mpd = "audio/ba7af36a-d695-425b-b235-40b344c19880/manifest.mpd"
    m3u8 = "audio/ba7af36a-d695-425b-b235-40b344c19880/master.m3u8"
    image = None

    @factory.post_generation
    def authors(self, create, extracted, **kwargs):
        if not create:
            return
        authors = extracted or [ArtistFactory()]
        for i, author in enumerate(authors):
            SongCredit.objects.create(song=self, author=author, author_priority=i)


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


class PlaybackContextFactory(BaseModelFactory):
    class Meta:
        model = PlaybackContext


class SongQueueFactory(BaseModelFactory):
    class Meta:
        model = SongQueue


class PlayerStateFactory(BaseModelFactory):
    class Meta:
        model = PlayerState

    queue = factory.SubFactory(SongQueueFactory)
    context = factory.SubFactory(PlaybackContextFactory)
