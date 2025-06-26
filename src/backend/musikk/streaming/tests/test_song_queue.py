from django.test import TestCase

from streaming.models import SongQueue, CollectionSong
from streaming.tests.factories import (
    BaseSongFactory,
    CollectionFactory,
    CollectionSongFactory,
)

SONG_COUNT = 5


class TestSongQueue(TestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        base_songs = BaseSongFactory.create_batch(SONG_COUNT)
        cls.collection = CollectionFactory(songs=base_songs)
        cls.songs = list(cls.collection.collectionsongs.order_by("position"))

    def test_append_to_empty(self):
        song_queue = SongQueue.objects.create()
        csong = self.songs[0]

        song_queue.add_song(csong, action=SongQueue.AddAction.APPEND)
        self.assertTrue(song_queue.head)
        self.assertTrue(song_queue.tail)
        self.assertIs(song_queue.head.song, csong)
        self.assertIs(song_queue.tail.song, csong)

        head, tail = song_queue.head, song_queue.tail
        self.assertIsNone(head.next)
        self.assertIsNone(head.prev)
        self.assertIsNone(tail.next)
        self.assertIsNone(tail.prev)

    def test_append_multiple_to_empty(self):
        song_queue = SongQueue.objects.create()

        for csong in self.songs:
            song_queue.add_song(csong, action=SongQueue.AddAction.APPEND)

        self.assertEqual(song_queue.song_count, len(self.songs))
        self.assertIs(song_queue.head.song, self.songs[0])
        self.assertIs(song_queue.tail.song, self.songs[-1])

    # def test_add_random_songs(self):
    #     song_queue = SongQueue.objects.create()
    #
    #     extra = BaseSongFactory.create_batch(SongQueue.default_size)
    #     song_queue.append_random_songs()
    #     self.assertEqual(song_queue.song_count, SongQueue.default_size)

    def test_add_to_middle(self):
        song_queue = SongQueue.objects.create()

        for csong in self.songs:
            song_queue.add_song(csong, action=SongQueue.AddAction.APPEND)

        new_csong = CollectionSongFactory()
        song_queue.add_song(new_csong, action=SongQueue.AddAction.ADD)

        head = song_queue.head
        self.assertEqual(head.song, self.songs[0])
        self.assertEqual(head.next.song, new_csong)
        self.assertEqual(head.next.prev.song, head.song)
        self.assertEqual(head.next.next.prev.song, new_csong)
        self.assertEqual(head.next.next.song, self.songs[1])

        self.assertEqual(song_queue.song_count, len(self.songs) + 1)

    def test_add_multiple_to_middle(self):
        song_queue = SongQueue.objects.create()

        for csong in self.songs:
            song_queue.add_song(csong, action=SongQueue.AddAction.APPEND)

        new_csongs = CollectionSongFactory.create_batch(3)
        for csong in new_csongs:
            song_queue.add_song(csong, action=SongQueue.AddAction.ADD)

        current = song_queue.head
        expected_order = [self.songs[0]] + new_csongs + self.songs[1:]
        for expected in expected_order:
            self.assertIsNotNone(current)
            self.assertEqual(current.song, expected)
            current = current.next

        self.assertEqual(song_queue.song_count, len(self.songs) + len(new_csongs))

    def test_add_collection_songs(self):
        song_queue = SongQueue.objects.create()
        csongs = list(self.collection.collectionsongs.order_by("position"))
        added_nodes = song_queue.add_collection(
            self.collection, action=SongQueue.AddAction.APPEND
        )

        self.assertEqual(song_queue.song_count, len(csongs))

        current = song_queue.head
        for expected in csongs:
            self.assertIsNotNone(current)
            self.assertEqual(current.song, expected)
            current = current.next

    def test_set_head_empty(self):
        song_queue = SongQueue.objects.create()
        csong = self.songs[0]

        song_queue.add_song(csong, action=SongQueue.AddAction.CHANGE_HEAD)

        self.assertEqual(song_queue.song_count, 1)
        self.assertEqual(song_queue.head.song, csong)
        self.assertEqual(song_queue.tail.song, csong)
        self.assertIsNone(song_queue.head.prev)
        self.assertIsNone(song_queue.head.next)

    def test_set_head_non_empty(self):
        song_queue = SongQueue.objects.create()

        for csong in self.songs:
            song_queue.add_song(csong, action=SongQueue.AddAction.APPEND)

        new_csong = CollectionSongFactory()
        song_queue.add_song(new_csong, action=SongQueue.AddAction.CHANGE_HEAD)

        self.assertEqual(song_queue.song_count, len(self.songs))
        self.assertEqual(song_queue.head.song, new_csong)
        self.assertEqual(song_queue.head.next.song, self.songs[1])
        self.assertEqual(song_queue.tail.song, self.songs[-1])

    def test_set_head_with_add_after_set(self):
        song_queue = SongQueue.objects.create()

        for csong in self.songs:
            song_queue.add_song(csong, action=SongQueue.AddAction.APPEND)

        song_queue.add_after = song_queue.head.next

        new_head = CollectionSongFactory()
        song_queue.add_song(new_head, action=SongQueue.AddAction.CHANGE_HEAD)

        inserted = CollectionSongFactory()
        song_queue.add_song(inserted, action=SongQueue.AddAction.ADD)

        self.assertEqual(song_queue.song_count, len(self.songs) + 1)
        self.assertEqual(song_queue.head.song, new_head)
        self.assertEqual(song_queue.head.next.next.song, inserted)
        self.assertEqual(song_queue.head.next.prev.song, new_head)

    def test_set_head_only_added_after_nodes(self):
        song_queue = SongQueue.objects.create()

        for csong in self.songs:
            song_queue.add_song(csong, action=SongQueue.AddAction.ADD)

        new_head = CollectionSongFactory()
        song_queue.add_song(new_head, action=SongQueue.AddAction.CHANGE_HEAD)

        self.assertEqual(song_queue.song_count, len(self.songs))
        self.assertEqual(song_queue.head.song, new_head)
        self.assertEqual(song_queue.head.next.prev.song, new_head)

    def test_change_head_with_collection(self):
        song_queue = SongQueue.objects.create()
        for csong in self.songs:
            song_queue.add_song(csong, action=SongQueue.AddAction.APPEND)

        new_collection = CollectionFactory()
        new_csongs = list(new_collection.collectionsongs.order_by("position"))
        song_queue.add_collection(
            new_collection, action=SongQueue.AddAction.CHANGE_HEAD
        )

        self.assertEqual(song_queue.song_count, len(self.songs) - 1 + len(new_csongs))

        current = song_queue.head
        for expected in new_csongs:
            self.assertIsNotNone(current)
            self.assertEqual(current.song, expected)
            current = current.next

        for expected in self.songs[1:]:
            self.assertIsNotNone(current)
            self.assertEqual(current.song, expected)
            current = current.next
