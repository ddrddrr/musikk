from django.conf import settings
from django.test import TestCase

from streaming.models import SongQueue, SongQueueNode, BaseSong
from streaming.tests.factories import BaseSongFactory

SONG_COUNT = 3


class TestSongQueue(TestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.songs = BaseSongFactory.create_batch(SONG_COUNT)

    def test_append_to_empty(self):
        song_queue = SongQueue.objects.create()
        song = self.songs[0]

        song_queue.add_song(song)
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

        [song_queue.add_song(song) for song in self.songs]

        self.assertTrue(song_queue.song_count == len(self.songs))
        self.assertTrue(song_queue.head)
        self.assertTrue(song_queue.tail)
        self.assertTrue(song_queue.head.song is self.songs[0])
        self.assertTrue(song_queue.tail.song is self.songs[-1])

    def test_add_random_songs(self):
        song_queue = SongQueue.objects.create()

        songs = BaseSongFactory.create_batch(settings.DEFAULT_SONG_QUEUE_SIZE * 2)
        song_queue.append_random_songs()

        for node in song_queue:
            self.assertTrue(node.song in songs)
