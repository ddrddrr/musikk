import factory
from base.tests.factories import BaseModelFactory
from users.tests.factories import ArtistFactory

from streaming.models import (
    BaseSong,
    Collection,
    CollectionCursor,
    PlaybackQueue,
    StoredPlaybackState,
)
from streaming.models.songs import CollectionSong, SongCredit

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


class CollectionCursorFactory(BaseModelFactory):
    class Meta:
        model = CollectionCursor


class PlaybackQueueFactory(BaseModelFactory):
    class Meta:
        model = PlaybackQueue


class StoredPlaybackStateFactory(BaseModelFactory):
    class Meta:
        model = StoredPlaybackState

    playback_queue = factory.SubFactory(PlaybackQueueFactory)
    collection_cursor = factory.SubFactory(CollectionCursorFactory)


def make_collection(n_songs: int = 5) -> tuple[Collection, list[CollectionSong]]:
    songs = BaseSongFactory.create_batch(n_songs)
    collection = CollectionFactory(songs=songs)
    return collection, list(collection.collectionsongs.order_by("position"))
