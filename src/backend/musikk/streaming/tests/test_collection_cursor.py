from django.test import TestCase

from streaming.models import CollectionCursor
from streaming.tests.factories import make_collection


class TestCollectionCursor(TestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.collection, cls.songs = make_collection(5)

    def test_advance_returns_next_song_and_moves_cursor(self):
        ctx = CollectionCursor.objects.create(collection=self.collection, cursor=-1)
        song = ctx.advance()

        ctx.refresh_from_db()
        assert song == self.songs[0]
        assert ctx.cursor == self.songs[0].position

    def test_advance_returns_none_when_exhausted(self):
        ctx = CollectionCursor.objects.create(
            collection=self.collection,
            cursor=self.songs[-1].position,
        )
        assert ctx.advance() is None

    def test_advance_returns_none_without_collection(self):
        ctx = CollectionCursor.objects.create()
        assert ctx.advance() is None

    def test_setup_sets_collection_and_cursor(self):
        other_collection, other_songs = make_collection(3)
        ctx = CollectionCursor.objects.create(
            collection=self.collection,
            cursor=self.songs[2].position,
        )

        ctx.setup(other_collection, other_songs[0].position)

        ctx.refresh_from_db()
        assert ctx.collection == other_collection
        assert ctx.cursor == other_songs[0].position

    def test_window_returns_songs_after_cursor(self):
        ctx = CollectionCursor.objects.create(
            collection=self.collection, cursor=self.songs[1].position
        )
        window = ctx.window()

        assert len(window) == 3
        assert window[0] == self.songs[2]

    def test_window_returns_empty_without_collection(self):
        ctx = CollectionCursor.objects.create()
        assert ctx.window() == []
