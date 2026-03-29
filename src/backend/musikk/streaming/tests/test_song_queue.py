from decimal import Decimal

from django.test import TestCase

from streaming.models import SongQueue, QueueSource, QueueItem, Collection
from streaming.models.song_queue import (
    POSITION_GAP,
    REFILL_THRESHOLD,
    FILL_BATCH,
    SourceType,
    ItemOrigin,
)
from streaming.models.songs import CollectionSong
from streaming.tests.factories import (
    BaseSongFactory,
    CollectionFactory,
    CollectionSongFactory,
)
from users.tests.factories import BaseUserFactory


def _make_collection(n_songs=5):
    songs = BaseSongFactory.create_batch(n_songs)
    collection = CollectionFactory(songs=songs)
    return collection, list(collection.collectionsongs.order_by("position"))


def _queue_with_profile():
    user = BaseUserFactory()
    profile = user.streamingprofile
    return profile.song_queue, profile


class TestInsert(TestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.collection, cls.songs = _make_collection()

    def test_insert_song_with_position(self):
        queue = SongQueue.objects.create()
        pos = Decimal("500")
        item = queue.insert_song(self.songs[0], position=pos)

        assert isinstance(item, QueueItem)
        assert item.position == pos
        assert item.collection_song == self.songs[0]
        assert item.queue == queue
        assert item.origin == ItemOrigin.USER

    def test_insert_song_without_position(self):
        queue = SongQueue.objects.create()
        item = queue.insert_song(self.songs[0])

        assert isinstance(item, QueueItem)
        assert item.collection_song == self.songs[0]
        assert item.origin == ItemOrigin.SOURCE
        assert item.queue == queue
        assert QueueItem.objects.filter(uuid=item.uuid).exists()
        assert QueueSource.objects.filter(queue=queue).count() == 0

    def test_insert_collection(self):
        queue = SongQueue.objects.create()
        source = queue.insert_collection(self.collection)

        assert isinstance(source, QueueSource)
        assert source.source_type == SourceType.COLLECTION
        assert source.collection == self.collection
        assert source.collection_cursor == -1
        assert QueueItem.objects.filter(queue=queue).count() == len(self.songs)

    def test_insert_raises_on_invalid_type(self):
        queue = SongQueue.objects.create()
        with self.assertRaises(TypeError):
            queue.insert("not a song or collection")

    def test_insert_same_collection_twice(self):
        queue = SongQueue.objects.create()
        queue.insert_collection(self.collection)
        queue.insert_collection(self.collection)

        song_list = list(
            QueueItem.objects.filter(queue=queue)
            .order_by("position")
            .values_list("collection_song_id", flat=True)
        )
        expected = [s.id for s in self.songs] + [s.id for s in self.songs]
        assert song_list == expected


class TestPlay(TestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.collection, cls.songs = _make_collection(5)

    def test_play_collection(self):
        queue = SongQueue.objects.create()
        extra = CollectionSongFactory()
        queue.insert_song(extra, position=Decimal("1"))

        queue.play_collection(self.collection)

        queue.refresh_from_db()
        assert queue.current_collection_song == self.songs[0]
        assert queue.context_collection == self.collection
        assert queue.context_cursor == self.songs[0].position
        assert queue.context_skip_indices == []
        assert QueueItem.objects.filter(queue=queue, collection_song=extra).exists()

        context_count = QueueItem.objects.filter(
            queue=queue, origin=ItemOrigin.CONTEXT
        ).count()
        assert context_count > 0

        other_collection, _ = _make_collection(3)
        queue.play_collection(other_collection)

        old_context = QueueItem.objects.filter(
            queue=queue,
            origin=ItemOrigin.CONTEXT,
            collection_song__collection=self.collection,
        )
        assert old_context.count() == 0
        assert QueueItem.objects.filter(queue=queue, collection_song=extra).exists()

        target = self.songs[2]
        queue.play_song(target)

        queue.refresh_from_db()
        assert queue.current_collection_song == target
        assert queue.context_collection == self.collection
        assert queue.context_cursor == target.position

    def test_play_empty_collection_does_nothing(self):
        queue = SongQueue.objects.create()
        queue.current_collection_song = self.songs[0]
        queue.save()

        empty = Collection.objects.create(type="playlist", title="Empty")
        queue.play_collection(empty)

        queue.refresh_from_db()
        assert queue.current_collection_song == self.songs[0]


class TestChooseAndNext(TestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.collection, cls.songs = _make_collection(10)

    def test_next_consumes_first_item(self):
        queue = SongQueue.objects.create()
        queue.insert_collection(self.collection)
        first_item = (
            QueueItem.objects.filter(queue=queue).order_by("position").first()
        )
        first_uuid = first_item.uuid
        first_song = first_item.collection_song

        result = queue.next()

        assert result == first_song
        queue.refresh_from_db()
        assert queue.current_collection_song == first_song
        assert not QueueItem.objects.filter(uuid=first_uuid).exists()

    def test_next_when_empty_returns_none(self):
        queue = SongQueue.objects.create()
        result = queue.next()

        assert result is None
        queue.refresh_from_db()
        assert queue.current_collection_song is None

    def test_choose_middle_deletes_items_below(self):
        queue = SongQueue.objects.create()
        queue.insert_collection(self.collection)

        items = list(QueueItem.objects.filter(queue=queue).order_by("position"))
        middle = items[4]
        queue.choose(middle.uuid)

        queue.refresh_from_db()
        assert queue.current_collection_song == middle.collection_song
        remaining = list(QueueItem.objects.filter(queue=queue).order_by("position"))
        for item in remaining:
            assert item.position > middle.position

    def test_choose_context_item_advances_cursor(self):
        queue = SongQueue.objects.create()
        queue.play_collection(self.collection)
        context_items = list(
            QueueItem.objects.filter(queue=queue, origin=ItemOrigin.CONTEXT).order_by(
                "position"
            )
        )
        chosen = context_items[2]
        expected_cursor = chosen.collection_song.position

        queue.choose(chosen.uuid)

        queue.refresh_from_db()
        assert queue.context_cursor == expected_cursor

    def test_choose_non_context_item_does_not_advance_context_cursor(self):
        queue = SongQueue.objects.create()
        queue.play_collection(self.collection)
        queue.refresh_from_db()
        cursor_before = queue.context_cursor

        extra = CollectionSongFactory()
        user_item = queue.insert_song(extra, position=Decimal("999999"))
        queue.choose(user_item.uuid)

        queue.refresh_from_db()
        assert queue.context_cursor == cursor_before

        remaining = QueueItem.objects.filter(queue=queue)
        for item in remaining:
            assert item.position > user_item.position

    def test_choose_resets_history_cursor(self):
        queue, profile = _queue_with_profile()
        queue.play_collection(self.collection)
        queue.next()
        queue.prev()
        assert queue.history_cursor == 1

        first_item = QueueItem.objects.filter(queue=queue).order_by("position").first()
        queue.choose(first_item.uuid)

        queue.refresh_from_db()
        assert queue.history_cursor == 0


class TestDeleteItem(TestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.collection, cls.songs = _make_collection()

    def test_delete_queue_item(self):
        queue = SongQueue.objects.create()
        queue.insert_collection(self.collection)
        items = list(QueueItem.objects.filter(queue=queue).order_by("position"))
        count_before = len(items)

        queue.remove(items[2].uuid)

        assert QueueItem.objects.filter(queue=queue).count() == count_before - 1
        assert not QueueItem.objects.filter(queue=queue, uuid=items[2].uuid).exists()

    def test_delete_context_item_adds_to_skip_indices(self):
        queue = SongQueue.objects.create()
        queue.play_collection(self.collection)

        context_items = list(
            QueueItem.objects.filter(queue=queue, origin=ItemOrigin.CONTEXT).order_by(
                "position"
            )
        )
        target = context_items[1]
        deleted_song = target.collection_song

        queue.remove(target.uuid)

        queue.refresh_from_db()
        assert deleted_song.position in queue.context_skip_indices
        remaining_songs = set(
            QueueItem.objects.filter(queue=queue).values_list(
                "collection_song_id", flat=True
            )
        )
        assert deleted_song.id not in remaining_songs

    def test_remove_non_context_item_does_not_add_skip_index(self):
        queue = SongQueue.objects.create()
        queue.play_collection(self.collection)
        extra = CollectionSongFactory()
        user_item = queue.insert_song(extra, position=Decimal("999999"))

        queue.refresh_from_db()
        skip_before = list(queue.context_skip_indices)

        queue.remove(user_item.uuid)

        queue.refresh_from_db()
        assert queue.context_skip_indices == skip_before

    def test_remove_context_item_at_cursor_does_not_add_skip_index(self):
        queue = SongQueue.objects.create()
        song = CollectionSongFactory()

        item = QueueItem.objects.create(
            queue=queue,
            collection_song=song,
            position=Decimal("1000"),
            origin=ItemOrigin.CONTEXT,
        )
        queue.context_cursor = song.position
        queue.save()

        queue.remove(item.uuid)

        queue.refresh_from_db()
        assert song.position not in queue.context_skip_indices


class TestPrev(TestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.collection, cls.songs = _make_collection(5)

    def test_prev_retrieves_from_history(self):
        queue, profile = _queue_with_profile()
        queue.play_collection(self.collection)
        first_current = queue.current_collection_song
        queue.next()
        current_before_prev = queue.current_collection_song
        count_before = QueueItem.objects.filter(queue=queue).count()

        result = queue.prev()

        queue.refresh_from_db()
        assert result is not None
        assert result.song == first_current.song
        assert QueueItem.objects.filter(queue=queue).count() == count_before + 1
        reinserted = QueueItem.objects.filter(queue=queue).order_by("position").first()
        assert reinserted.collection_song == current_before_prev

    def test_prev_multi_step(self):
        queue, profile = _queue_with_profile()
        queue.play_collection(self.collection)

        played = [queue.current_collection_song]
        queue.next()
        played.append(queue.current_collection_song)
        queue.next()

        prev1 = queue.prev()
        prev2 = queue.prev()

        assert prev1.song == played[1].song
        assert prev2.song == played[0].song
        queue.refresh_from_db()
        assert queue.history_cursor == 2

    def test_prev_without_current_song_does_not_reinsert(self):
        queue, profile = _queue_with_profile()
        queue.play_collection(self.collection)
        queue.next()
        queue.current_collection_song = None
        queue.save()

        count_before = QueueItem.objects.filter(queue=queue).count()
        queue.prev()

        assert QueueItem.objects.filter(queue=queue).count() == count_before

    def test_prev_on_empty_history_returns_none(self):
        queue, profile = _queue_with_profile()
        result = queue.prev()

        assert result is None


class TestReorder(TestCase):
    def test_reorder_between_two_items(self):
        queue = SongQueue.objects.create()
        s1, s2, s3 = CollectionSongFactory.create_batch(3)

        i1 = queue.insert_song(s1, position=Decimal("1000"))
        i2 = queue.insert_song(s2, position=Decimal("2000"))
        i3 = queue.insert_song(s3, position=Decimal("3000"))

        queue.reorder(i3.uuid, before_uuid=i1.uuid, after_uuid=i2.uuid)

        i3.refresh_from_db()
        assert i3.position == Decimal("1500")

    def test_reorder_to_top(self):
        queue = SongQueue.objects.create()
        s1, s2 = CollectionSongFactory.create_batch(2)

        i1 = queue.insert_song(s1, position=Decimal("1000"))
        i2 = queue.insert_song(s2, position=Decimal("2000"))

        queue.reorder(i2.uuid, after_uuid=i1.uuid)

        i2.refresh_from_db()
        assert i2.position == i1.position - POSITION_GAP

    def test_reorder_to_bottom(self):
        queue = SongQueue.objects.create()
        s1, s2 = CollectionSongFactory.create_batch(2)

        i1 = queue.insert_song(s1, position=Decimal("1000"))
        i2 = queue.insert_song(s2, position=Decimal("2000"))

        queue.reorder(i1.uuid, before_uuid=i2.uuid)

        i1.refresh_from_db()
        assert i1.position == i2.position + POSITION_GAP


class TestClear(TestCase):
    def test_clear_preserves_context_and_removes_queued_items(self):
        collection, songs = _make_collection(3)
        queue = SongQueue.objects.create()
        queue.play_collection(collection)
        queue.refresh_from_db()

        current_song = queue.current_collection_song
        cursor_before = queue.context_cursor

        extra = CollectionSongFactory()
        queue.insert_song(extra, position=Decimal("999999"))

        queue.clear()

        queue.refresh_from_db()
        assert queue.current_collection_song == current_song
        assert queue.context_collection == collection
        assert queue.context_cursor == cursor_before
        assert queue.context_skip_indices == []
        assert queue.history_cursor == 0
        assert QueueSource.objects.filter(queue=queue).count() == 0

        items = QueueItem.objects.filter(queue=queue)
        assert items.count() > 0
        assert not items.filter(origin=ItemOrigin.USER).exists()
        assert not items.filter(origin=ItemOrigin.SOURCE).exists()
        assert items.filter(origin=ItemOrigin.CONTEXT).count() == items.count()


class TestWindow(TestCase):
    def test_window_returns_ordered_items(self):
        queue = SongQueue.objects.create()
        s1, s2, s3 = CollectionSongFactory.create_batch(3)
        queue.insert_song(s1, position=Decimal("3000"))
        queue.insert_song(s2, position=Decimal("1000"))
        queue.insert_song(s3, position=Decimal("2000"))

        window = queue.window()

        positions = [item.position for item in window]
        assert positions == sorted(positions)
        assert len(window) == 3

    def test_window_respects_cap(self):
        collection, _ = _make_collection(10)
        queue = SongQueue.objects.create()
        queue.insert_collection(collection)

        window = queue.window(cap=3)

        assert len(window) == 3


class TestRefill(TestCase):
    def test_sources_processed_before_context(self):
        collection, songs = _make_collection(5)
        queue = SongQueue.objects.create()

        queue.context_collection = collection
        queue.context_cursor = -1
        queue.save()

        extra = CollectionSongFactory()
        QueueSource.objects.create(
            queue=queue,
            source_type=SourceType.SONG,
            collection_song=extra,
        )

        queue._fill()

        items = list(QueueItem.objects.filter(queue=queue).order_by("position"))
        assert items[0].collection_song == extra
        assert items[0].origin == ItemOrigin.SOURCE
        assert all(i.origin == ItemOrigin.CONTEXT for i in items[1:])

    def test_refill_does_not_exceed_batch_size(self):
        songs = BaseSongFactory.create_batch(FILL_BATCH + 20)
        collection = CollectionFactory(songs=songs)
        queue = SongQueue.objects.create()
        queue.insert_collection(collection)

        assert QueueItem.objects.filter(queue=queue).count() == FILL_BATCH
        assert QueueSource.objects.filter(queue=queue).count() == 1

    def test_refill_skips_when_above_threshold(self):
        queue = SongQueue.objects.create()
        song = CollectionSongFactory()
        QueueItem.objects.bulk_create(
            [
                QueueItem(
                    queue=queue,
                    collection_song=song,
                    position=Decimal(i * 1000),
                    origin=ItemOrigin.USER,
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

    def test_context_does_not_re_process_existing_items(self):
        collection, songs = _make_collection(5)
        queue = SongQueue.objects.create()
        queue.play_collection(collection)

        count_after_first_refill = QueueItem.objects.filter(queue=queue).count()
        queue._fill()

        assert QueueItem.objects.filter(queue=queue).count() == count_after_first_refill


class TestIsEmpty(TestCase):
    def test_empty_queue(self):
        queue = SongQueue.objects.create()
        assert queue.is_empty()

    def test_not_empty_with_current_song(self):
        queue = SongQueue.objects.create()
        queue.current_collection_song = CollectionSongFactory()
        queue.save()
        assert not queue.is_empty()

    def test_not_empty_with_items(self):
        queue = SongQueue.objects.create()
        queue.insert_song(CollectionSongFactory(), position=Decimal("1000"))
        assert not queue.is_empty()


class TestAdvanceContext(TestCase):
    def test_context_advances_after_queue_exhausted(self):
        collection, songs = _make_collection(FILL_BATCH + 5)
        queue = SongQueue.objects.create()
        queue.play_collection(collection)

        for _ in range(FILL_BATCH):
            queue.next()

        queue.refresh_from_db()
        assert queue.current_collection_song is not None
        assert QueueItem.objects.filter(queue=queue).count() > 0

    def test_context_exhausted_sets_current_song_none(self):
        collection, songs = _make_collection(2)
        queue = SongQueue.objects.create()
        queue.play_collection(collection)

        queue.next()
        result = queue.next()

        queue.refresh_from_db()
        assert result is None
        assert queue.current_collection_song is None
