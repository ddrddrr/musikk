from django.conf import settings
from django.test import TestCase

from streaming.models import SongQueue, SongQueueNode, BaseSong
from streaming.tests.factories import BaseSongFactory, SongCollectionFactory

SONG_COUNT = 5


class TestSongQueue(TestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.songs = BaseSongFactory.create_batch(SONG_COUNT)

    def test_append_to_empty(self):
        song_queue = SongQueue.objects.create()
        song = self.songs[0]

        song_queue.add_song(song, action=SongQueue.AddAction.APPEND)
        self.assertTrue(song_queue.head)
        self.assertTrue(song_queue.tail)
        self.assertTrue(song_queue.head.song is song)
        self.assertTrue(song_queue.tail.song is song)

        head, tail = song_queue.head, song_queue.tail
        self.assertTrue(head.next is None)
        self.assertTrue(head.prev is None)
        self.assertTrue(tail.next is None)
        self.assertTrue(tail.prev is None)

    def test_append_multiple_to_empty(self):
        song_queue = SongQueue.objects.create()

        [
            song_queue.add_song(song, action=SongQueue.AddAction.APPEND)
            for song in self.songs
        ]

        self.assertTrue(song_queue.song_count == len(self.songs))
        self.assertTrue(song_queue.head)
        self.assertTrue(song_queue.tail)
        self.assertTrue(song_queue.head.song is self.songs[0])
        self.assertTrue(song_queue.tail.song is self.songs[-1])

    def test_add_random_songs(self):
        song_queue = SongQueue.objects.create()

        # add extra
        songs = BaseSongFactory.create_batch(SongQueue.default_size)
        song_queue.append_random_songs()
        self.assertEqual(song_queue.song_count, SongQueue.default_size)

    def test_add_to_middle(self):
        song_queue = SongQueue.objects.create()

        for song in self.songs:
            song_queue.add_song(song, action=SongQueue.AddAction.APPEND)

        new_song = BaseSongFactory.create()
        song_queue.add_song(new_song, action=SongQueue.AddAction.ADD)

        head = song_queue.head
        self.assertEqual(head.song, self.songs[0])
        self.assertEqual(head.next.song, new_song)
        self.assertEqual(head.next.prev.song, head.song)
        self.assertEqual(head.next.next.prev.song, new_song)
        self.assertEqual(head.next.next.song, self.songs[1])

        self.assertEqual(song_queue.song_count, len(self.songs) + 1)

    def test_add_multiple_to_middle(self):
        song_queue = SongQueue.objects.create()

        for song in self.songs:
            song_queue.add_song(song, action=SongQueue.AddAction.APPEND)

        new_songs = BaseSongFactory.create_batch(3)
        for song in new_songs:
            song_queue.add_song(song, action=SongQueue.AddAction.ADD)

        current = song_queue.head
        expected_order = [self.songs[0]] + new_songs + self.songs[1:]
        for expected_song in expected_order:
            self.assertIsNotNone(current)
            self.assertEqual(current.song, expected_song)
            current = current.next

        self.assertEqual(song_queue.song_count, len(self.songs) + len(new_songs))

    def test_add_collection_songs(self):
        song_queue = SongQueue.objects.create()

        collection = SongCollectionFactory()
        csongs = collection.ordered_songs()
        added_nodes = song_queue.add_collection(
            collection, action=SongQueue.AddAction.APPEND
        )

        self.assertEqual(song_queue.song_count, len(csongs))

        current = song_queue.head
        for expected_song in csongs:
            self.assertIsNotNone(current)
            self.assertEqual(current.song, expected_song)
            current = current.next

    def test_set_head_empty(self):
        song_queue = SongQueue.objects.create()
        song = self.songs[0]

        song_queue.add_song(song, action=SongQueue.AddAction.CHANGE_HEAD)

        self.assertEqual(song_queue.song_count, 1)
        self.assertEqual(song_queue.head.song, song)
        self.assertEqual(song_queue.tail.song, song)
        self.assertIsNone(song_queue.head.prev)
        self.assertIsNone(song_queue.head.next)

    def test_set_head_non_empty(self):
        song_queue = SongQueue.objects.create()

        for song in self.songs:
            song_queue.add_song(song, action=SongQueue.AddAction.APPEND)

        new_song = BaseSongFactory.create()
        song_queue.add_song(new_song, action=SongQueue.AddAction.CHANGE_HEAD)

        self.assertEqual(song_queue.song_count, len(self.songs))
        self.assertEqual(song_queue.head.song, new_song)
        self.assertEqual(song_queue.head.next.song, self.songs[1])
        self.assertEqual(song_queue.tail.song, self.songs[-1])

    def test_set_head_with_add_after_set(self):
        song_queue = SongQueue.objects.create()

        for song in self.songs:
            song_queue.add_song(song, action=SongQueue.AddAction.APPEND)

        song_queue.add_after = song_queue.head.next

        new_head = BaseSongFactory.create()
        n1 = song_queue.add_song(new_head, action=SongQueue.AddAction.CHANGE_HEAD)

        inserted_song = BaseSongFactory.create()
        n2 = song_queue.add_song(inserted_song, action=SongQueue.AddAction.ADD)

        self.assertEqual(song_queue.song_count, len(self.songs) + 1)
        self.assertEqual(song_queue.head.song, new_head)
        self.assertEqual(song_queue.head.next.next.song, inserted_song)
        self.assertEqual(song_queue.head.next.prev.song, new_head)

    def test_set_head_only_added_after_nodes(self):
        song_queue = SongQueue.objects.create()

        for song in self.songs:
            song_queue.add_song(song, action=SongQueue.AddAction.ADD)

        new_head = BaseSongFactory.create()
        n1 = song_queue.add_song(new_head, action=SongQueue.AddAction.CHANGE_HEAD)

        self.assertEqual(song_queue.song_count, len(self.songs))
        self.assertEqual(song_queue.head.song, new_head)
        self.assertEqual(song_queue.head.next.prev.song, new_head)

    def test_change_head_with_collection(self):
        song_queue = SongQueue.objects.create()
        for song in self.songs:
            song_queue.add_song(song, action=SongQueue.AddAction.APPEND)

        collection = SongCollectionFactory()
        csongs = collection.ordered_songs()
        song_queue.add_collection(collection, action=SongQueue.AddAction.CHANGE_HEAD)

        self.assertEqual(song_queue.song_count, len(self.songs) - 1 + len(csongs))

        current = song_queue.head
        for expected_song in csongs:
            self.assertIsNotNone(current)
            self.assertEqual(current.song, expected_song)
            current = current.next

        for expected_song in self.songs[1:]:
            self.assertIsNotNone(current)
            self.assertEqual(current.song, expected_song)
            current = current.next
