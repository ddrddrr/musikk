from decimal import Decimal

from django.test import TestCase

from streaming.models import Collection, PlaybackQueue, QueueItem, QueueSource
from streaming.models.playback_queue import (
    FILL_BATCH,
    POSITION_GAP,
    REFILL_THRESHOLD,
    SourceType,
)
from streaming.tests.factories import (
    BaseSongFactory,
    CollectionFactory,
    CollectionSongFactory,
    make_collection,
)


class TestQueueInsert(TestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.collection, cls.songs = make_collection()

    def test_insert_song(self):
        queue = PlaybackQueue.objects.create()
        pos = Decimal("500")
        item = queue.insert_song(self.songs[0], position=pos)

        assert isinstance(item, QueueItem)
        assert item.position == pos
        assert item.collection_song == self.songs[0]
        assert item.queue == queue

    def test_append_song(self):
        queue = PlaybackQueue.objects.create()
        source = queue.append_song(self.songs[0])

        assert isinstance(source, QueueSource)
        assert source.source_type == SourceType.SONG
        assert source.collection_song == self.songs[0]
        assert source.queue == queue

        item = QueueItem.objects.filter(queue=queue).first()
        assert item is not None
        assert item.collection_song == self.songs[0]

    def test_append_collection(self):
        queue = PlaybackQueue.objects.create()
        source = queue.append_collection(self.collection)

        assert isinstance(source, QueueSource)
        assert source.source_type == SourceType.COLLECTION
        assert source.collection == self.collection
        assert source.collection_cursor == -1
        assert QueueItem.objects.filter(queue=queue).count() == len(self.songs)

    def test_append_empty_collection(self):
        queue = PlaybackQueue.objects.create()
        empty = Collection.objects.create(type="playlist", title="Empty")

        queue.append_collection(empty)

        assert QueueItem.objects.filter(queue=queue).count() == 0
        assert QueueSource.objects.filter(queue=queue).count() == 0

    def test_append_raises_on_invalid_type(self):
        queue = PlaybackQueue.objects.create()
        with self.assertRaises(TypeError):
            queue.append("not a song or collection")


class TestQueueRemove(TestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.collection, cls.songs = make_collection()

    def test_remove_on_already_deleted_item_raises(self):
        queue = PlaybackQueue.objects.create()
        queue.append_collection(self.collection)
        item = QueueItem.objects.filter(queue=queue).first()
        item.delete()

        with self.assertRaises(ValueError):
            queue.remove(item)

    def test_remove_deletes_item(self):
        queue = PlaybackQueue.objects.create()
        queue.append_collection(self.collection)
        items = list(QueueItem.objects.filter(queue=queue).order_by("position"))
        count_before = len(items)

        queue.remove(items[2])

        assert QueueItem.objects.filter(queue=queue).count() == count_before - 1
        assert not QueueItem.objects.filter(queue=queue, uuid=items[2].uuid).exists()


class TestQueuePopFirst(TestCase):
    def test_pop_first_returns_and_removes(self):
        queue = PlaybackQueue.objects.create()
        s1, s2 = CollectionSongFactory.create_batch(2)
        queue.insert_song(s1, position=Decimal("1000"))
        queue.insert_song(s2, position=Decimal("2000"))

        result = queue.pop_first()

        assert result == s1
        assert QueueItem.objects.filter(queue=queue).count() == 1

    def test_pop_first_returns_none_when_empty(self):
        queue = PlaybackQueue.objects.create()
        assert queue.pop_first() is None


class TestQueuePushFront(TestCase):
    def test_push_front_puts_the_song_before_the_first_item(self):
        queue = PlaybackQueue.objects.create()
        s1, s2 = CollectionSongFactory.create_batch(2)
        first = queue.insert_song(s1, position=Decimal("1000"))

        item = queue.push_front(s2)

        assert item.position == first.position - POSITION_GAP
        assert queue.pop_first() == s2

    def test_push_front_into_empty_queue_keeps_later_appends_after_it(self):
        queue = PlaybackQueue.objects.create()
        s1, s2 = CollectionSongFactory.create_batch(2)

        queue.push_front(s1)
        queue.append_song(s2)

        items = list(QueueItem.objects.filter(queue=queue).order_by("position"))
        assert [item.collection_song for item in items] == [s1, s2]


class TestQueueClear(TestCase):
    def test_clear_removes_items_and_sources(self):
        queue = PlaybackQueue.objects.create()
        collection, _ = make_collection(3)
        queue.append_collection(collection)
        extra = CollectionSongFactory()
        queue.insert_song(extra, position=Decimal("999999"))

        queue.clear()

        queue.refresh_from_db()
        assert QueueItem.objects.filter(queue=queue).count() == 0
        assert QueueSource.objects.filter(queue=queue).count() == 0
        assert queue.next_item_position == POSITION_GAP


class TestQueueWindow(TestCase):
    def test_window_returns_ordered_items(self):
        queue = PlaybackQueue.objects.create()
        s1, s2, s3 = CollectionSongFactory.create_batch(3)
        queue.insert_song(s1, position=Decimal("3000"))
        queue.insert_song(s2, position=Decimal("1000"))
        queue.insert_song(s3, position=Decimal("2000"))

        window = queue.window()

        positions = [item.position for item in window]
        assert positions == sorted(positions)
        assert len(window) == 3


class TestRefill(TestCase):
    def test_refill_does_not_exceed_batch_size(self):
        songs = BaseSongFactory.create_batch(FILL_BATCH + 20)
        collection = CollectionFactory(songs=songs)
        queue = PlaybackQueue.objects.create()
        queue.append_collection(collection)

        assert QueueItem.objects.filter(queue=queue).count() == FILL_BATCH
        assert QueueSource.objects.filter(queue=queue).count() == 1

        source = QueueSource.objects.get(queue=queue)
        last_item = QueueItem.objects.filter(queue=queue).order_by("-position").first()
        assert source.collection_cursor == last_item.collection_song.position

    def test_refill_deletes_exhausted_source(self):
        songs = BaseSongFactory.create_batch(3)
        collection = CollectionFactory(songs=songs)
        queue = PlaybackQueue.objects.create()
        queue.append_collection(collection)

        assert QueueItem.objects.filter(queue=queue).count() == 3
        assert QueueSource.objects.filter(queue=queue).count() == 0

    def test_refill_skips_when_above_threshold(self):
        queue = PlaybackQueue.objects.create()
        song = CollectionSongFactory()
        QueueItem.objects.bulk_create(
            [
                QueueItem(
                    queue=queue,
                    collection_song=song,
                    position=Decimal(i * 1000),
                )
                for i in range(REFILL_THRESHOLD)
            ]
        )
        extra = CollectionSongFactory()
        QueueSource.objects.create(
            queue=queue,
            source_type=SourceType.SONG,
            collection_song=extra,
        )

        queue._fill()

        assert QueueItem.objects.filter(queue=queue).count() == REFILL_THRESHOLD
        assert QueueSource.objects.filter(queue=queue).count() == 1
