from decimal import Decimal

from django.test import TestCase
from users.tests.factories import BaseUserFactory

from streaming.models import Collection, QueueItem, QueueSource, SongQueue
from streaming.models.song_queue import (
    FILL_BATCH,
    POSITION_GAP,
    REFILL_THRESHOLD,
    PlaybackContext,
    SourceType,
)
from streaming.models.songs import CollectionSong
from streaming.tests.factories import (
    BaseSongFactory,
    CollectionFactory,
    CollectionSongFactory,
    PlayerStateFactory,
)


def _make_collection(n_songs=5):
    songs = BaseSongFactory.create_batch(n_songs)
    collection = CollectionFactory(songs=songs)
    return collection, list(collection.collectionsongs.order_by("position"))


def _player_with_profile():
    user = BaseUserFactory()
    profile = user.streamingprofile
    return profile.player, profile


class TestPlaybackContext(TestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.collection, cls.songs = _make_collection(5)

    def test_advance_returns_next_song_and_moves_cursor(self):
        ctx = PlaybackContext.objects.create(collection=self.collection, cursor=-1)
        song = ctx.advance()

        ctx.refresh_from_db()
        assert song == self.songs[0]
        assert ctx.cursor == self.songs[0].position

    def test_advance_skips_skip_indices(self):
        ctx = PlaybackContext.objects.create(
            collection=self.collection,
            cursor=-1,
            skip_indices=[self.songs[0].position],
        )
        song = ctx.advance()

        assert song == self.songs[1]

    def test_advance_returns_none_when_exhausted(self):
        ctx = PlaybackContext.objects.create(
            collection=self.collection,
            cursor=self.songs[-1].position,
        )
        assert ctx.advance() is None

    def test_advance_returns_none_without_collection(self):
        ctx = PlaybackContext.objects.create()
        assert ctx.advance() is None

    def test_skip_adds_position_ahead_of_cursor(self):
        ctx = PlaybackContext.objects.create(
            collection=self.collection, cursor=self.songs[0].position
        )
        ctx.skip(self.songs[2].position)

        ctx.refresh_from_db()
        assert self.songs[2].position in ctx.skip_indices

    def test_skip_ignores_position_at_or_before_cursor(self):
        ctx = PlaybackContext.objects.create(
            collection=self.collection, cursor=self.songs[2].position
        )
        ctx.skip(self.songs[1].position)
        ctx.skip(self.songs[2].position)

        ctx.refresh_from_db()
        assert ctx.skip_indices == []

    def test_setup_sets_collection_and_clears_state(self):
        other_collection, other_songs = _make_collection(3)
        ctx = PlaybackContext.objects.create(
            collection=self.collection,
            cursor=self.songs[2].position,
            skip_indices=[self.songs[1].position],
        )

        ctx.setup(other_collection, other_songs[0].position)

        ctx.refresh_from_db()
        assert ctx.collection == other_collection
        assert ctx.cursor == other_songs[0].position
        assert ctx.skip_indices == []

    def test_advance_returns_none_when_all_remaining_skipped(self):
        ctx = PlaybackContext.objects.create(
            collection=self.collection,
            cursor=-1,
            skip_indices=[s.position for s in self.songs],
        )
        assert ctx.advance() is None

    def test_window_returns_songs_after_cursor(self):
        ctx = PlaybackContext.objects.create(
            collection=self.collection, cursor=self.songs[1].position
        )
        window = ctx.window()

        assert len(window) == 3
        assert window[0] == self.songs[2]

    def test_window_excludes_skipped(self):
        ctx = PlaybackContext.objects.create(
            collection=self.collection,
            cursor=-1,
            skip_indices=[self.songs[1].position],
        )
        window = ctx.window()

        song_ids = [s.id for s in window]
        assert self.songs[1].id not in song_ids
        assert len(window) == 4

    def test_window_returns_empty_without_collection(self):
        ctx = PlaybackContext.objects.create()
        assert ctx.window() == []


class TestQueueInsert(TestCase):
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

    def test_insert_song_without_position(self):
        queue = SongQueue.objects.create()
        source = queue.insert_song(self.songs[0])

        assert isinstance(source, QueueSource)
        assert source.source_type == SourceType.SONG
        assert source.collection_song == self.songs[0]
        assert source.queue == queue

        item = QueueItem.objects.filter(queue=queue).first()
        assert item is not None
        assert item.collection_song == self.songs[0]

    def test_insert_collection(self):
        queue = SongQueue.objects.create()
        source = queue.insert_collection(self.collection)

        assert isinstance(source, QueueSource)
        assert source.source_type == SourceType.COLLECTION
        assert source.collection == self.collection
        assert source.collection_cursor == -1
        assert QueueItem.objects.filter(queue=queue).count() == len(self.songs)

    def test_insert_empty_collection(self):
        queue = SongQueue.objects.create()
        empty = Collection.objects.create(type="playlist", title="Empty")

        queue.insert_collection(empty)

        assert QueueItem.objects.filter(queue=queue).count() == 0
        assert QueueSource.objects.filter(queue=queue).count() == 0

    def test_insert_raises_on_invalid_type(self):
        queue = SongQueue.objects.create()
        with self.assertRaises(TypeError):
            queue.insert("not a song or collection")


class TestQueueRemove(TestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.collection, cls.songs = _make_collection()

    def test_remove_on_already_deleted_item_raises(self):
        queue = SongQueue.objects.create()
        queue.insert_collection(self.collection)
        item = QueueItem.objects.filter(queue=queue).first()
        item.delete()

        with self.assertRaises(ValueError):
            queue.remove(item)

    def test_remove_deletes_item(self):
        queue = SongQueue.objects.create()
        queue.insert_collection(self.collection)
        items = list(QueueItem.objects.filter(queue=queue).order_by("position"))
        count_before = len(items)

        queue.remove(items[2])

        assert QueueItem.objects.filter(queue=queue).count() == count_before - 1
        assert not QueueItem.objects.filter(queue=queue, uuid=items[2].uuid).exists()


class TestQueuePopFirst(TestCase):
    def test_pop_first_returns_and_removes(self):
        queue = SongQueue.objects.create()
        s1, s2 = CollectionSongFactory.create_batch(2)
        queue.insert_song(s1, position=Decimal("1000"))
        queue.insert_song(s2, position=Decimal("2000"))

        result = queue.pop_first()

        assert result == s1
        assert QueueItem.objects.filter(queue=queue).count() == 1

    def test_pop_first_returns_none_when_empty(self):
        queue = SongQueue.objects.create()
        assert queue.pop_first() is None


class TestQueueClear(TestCase):
    def test_clear_removes_items_and_sources(self):
        queue = SongQueue.objects.create()
        collection, _ = _make_collection(3)
        queue.insert_collection(collection)
        extra = CollectionSongFactory()
        queue.insert_song(extra, position=Decimal("999999"))

        queue.clear()

        queue.refresh_from_db()
        assert QueueItem.objects.filter(queue=queue).count() == 0
        assert QueueSource.objects.filter(queue=queue).count() == 0
        assert queue.next_item_position == POSITION_GAP


class TestQueueWindow(TestCase):
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


class TestReorder(TestCase):
    def test_reorder_between_two_items(self):
        queue = SongQueue.objects.create()
        s1, s2, s3 = CollectionSongFactory.create_batch(3)

        i1 = queue.insert_song(s1, position=Decimal("1000"))
        i2 = queue.insert_song(s2, position=Decimal("2000"))
        i3 = queue.insert_song(s3, position=Decimal("3000"))

        queue.reorder(i3, before=i1, after=i2)

        i3.refresh_from_db()
        assert i3.position == Decimal("1500")

    def test_reorder_to_top(self):
        queue = SongQueue.objects.create()
        s1, s2 = CollectionSongFactory.create_batch(2)

        i1 = queue.insert_song(s1, position=Decimal("1000"))
        i2 = queue.insert_song(s2, position=Decimal("2000"))

        queue.reorder(i2, after=i1)

        i2.refresh_from_db()
        assert i2.position == i1.position - POSITION_GAP

    def test_reorder_to_bottom(self):
        queue = SongQueue.objects.create()
        s1, s2 = CollectionSongFactory.create_batch(2)

        i1 = queue.insert_song(s1, position=Decimal("1000"))
        i2 = queue.insert_song(s2, position=Decimal("2000"))

        queue.reorder(i1, before=i2)

        i1.refresh_from_db()
        assert i1.position == i2.position + POSITION_GAP

    def test_reorder_to_bottom_allows_subsequent_append(self):
        queue = SongQueue.objects.create()
        s1, s2, s3 = CollectionSongFactory.create_batch(3)

        i1 = queue.insert_song(s1, position=Decimal("1000"))
        i2 = queue.insert_song(s2, position=Decimal("2000"))

        queue.reorder(i1, before=i2)
        i1.refresh_from_db()

        queue.insert_song(s3)
        items = list(QueueItem.objects.filter(queue=queue).order_by("position"))

        assert items[-1].collection_song == s3
        assert items[-1].position > i1.position


class TestRefill(TestCase):
    def test_refill_does_not_exceed_batch_size(self):
        songs = BaseSongFactory.create_batch(FILL_BATCH + 20)
        collection = CollectionFactory(songs=songs)
        queue = SongQueue.objects.create()
        queue.insert_collection(collection)

        assert QueueItem.objects.filter(queue=queue).count() == FILL_BATCH
        assert QueueSource.objects.filter(queue=queue).count() == 1

        source = QueueSource.objects.get(queue=queue)
        last_item = QueueItem.objects.filter(queue=queue).order_by("-position").first()
        assert source.collection_cursor == last_item.collection_song.position

    def test_refill_deletes_exhausted_source(self):
        songs = BaseSongFactory.create_batch(3)
        collection = CollectionFactory(songs=songs)
        queue = SongQueue.objects.create()
        queue.insert_collection(collection)

        assert QueueItem.objects.filter(queue=queue).count() == 3
        assert QueueSource.objects.filter(queue=queue).count() == 0

    def test_refill_skips_when_above_threshold(self):
        queue = SongQueue.objects.create()
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


class TestPlay(TestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.collection, cls.songs = _make_collection(5)

    def test_play_collection(self):
        player = PlayerStateFactory()

        player.play_collection(self.collection)

        player.refresh_from_db()
        player.context.refresh_from_db()
        assert player.current_collection_song == self.songs[0]
        assert player.context.collection == self.collection
        assert player.context.cursor == self.songs[0].position
        assert player.context.skip_indices == []

    def test_play_song_resets_context(self):
        player = PlayerStateFactory()
        player.play_collection(self.collection)

        other_collection, other_songs = _make_collection(3)
        target = other_songs[1]
        player.play_song(target)

        player.refresh_from_db()
        player.context.refresh_from_db()
        assert player.current_collection_song == target
        assert player.context.collection == other_collection
        assert player.context.cursor == target.position

    def test_play_empty_collection_does_nothing(self):
        player = PlayerStateFactory()
        player.play_song(self.songs[0])
        player.refresh_from_db()

        empty = Collection.objects.create(type="playlist", title="Empty")
        player.play_collection(empty)

        player.refresh_from_db()
        assert player.current_collection_song == self.songs[0]


class TestAdvanceAndChoose(TestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.collection, cls.songs = _make_collection(10)

    def test_choose_sets_current_and_removes_items_before(self):
        player = PlayerStateFactory()
        player.queue.insert_collection(self.collection)

        items = list(QueueItem.objects.filter(queue=player.queue).order_by("position"))
        middle = items[4]
        result = player.choose_queue_song(middle)

        player.refresh_from_db()
        assert result == middle.collection_song
        assert player.current_collection_song == middle.collection_song
        remaining = list(
            QueueItem.objects.filter(queue=player.queue).order_by("position")
        )
        for item in remaining:
            assert item.position > middle.position

    def test_choose_resets_history_cursor(self):
        player, profile = _player_with_profile()
        player.play_collection(self.collection)
        player.advance()
        player.prev()
        assert player.history_cursor == 1

        s1 = CollectionSongFactory()
        item = player.queue.insert_song(s1, position=Decimal("1000"))
        player.choose_queue_song(item)

        player.refresh_from_db()
        assert player.history_cursor == 0


class TestChooseContextSong(TestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.collection, cls.songs = _make_collection(5)

    def test_choose_context_song_sets_current_and_advances_cursor(self):
        player = PlayerStateFactory()
        player.context.setup(self.collection, -1)
        target = self.songs[2]

        result = player.choose_context_song(target)

        player.refresh_from_db()
        player.context.refresh_from_db()
        assert result == target
        assert player.current_collection_song == target
        assert player.context.cursor == target.position

    def test_choose_context_song_prunes_skip_indices(self):
        player = PlayerStateFactory()
        player.context.setup(self.collection, -1)
        player.context.skip_indices = [
            self.songs[1].position,
            self.songs[3].position,
        ]
        player.context.save()

        player.choose_context_song(self.songs[2])

        player.context.refresh_from_db()
        assert self.songs[1].position not in player.context.skip_indices
        assert self.songs[3].position in player.context.skip_indices

    def test_choose_context_song_does_not_affect_queue(self):
        player = PlayerStateFactory()
        player.context.setup(self.collection, -1)
        extra = CollectionSongFactory()
        player.queue.insert_song(extra, position=Decimal("1000"))

        player.choose_context_song(self.songs[2])

        assert QueueItem.objects.filter(
            queue=player.queue, collection_song=extra
        ).exists()


class TestMoveFromContextToQueue(TestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.collection, cls.songs = _make_collection(5)

    def test_move_creates_queue_item_and_skips_context(self):
        player = PlayerStateFactory()
        player.context.setup(self.collection, -1)

        item = player.move_from_context_to_queue(self.songs[2], Decimal("5000"))

        assert isinstance(item, QueueItem)
        assert item.collection_song == self.songs[2]
        player.context.refresh_from_db()
        assert self.songs[2].position in player.context.skip_indices

    def test_move_with_null_position_does_not_skip_context(self):
        player = PlayerStateFactory()
        player.context.setup(self.collection, -1)
        song_no_pos = CollectionSong.objects.create(
            collection=None,
            song=self.songs[0].song,
        )

        item = player.move_from_context_to_queue(song_no_pos, Decimal("5000"))

        assert isinstance(item, QueueItem)
        player.context.refresh_from_db()
        assert player.context.skip_indices == []


class TestPrev(TestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.collection, cls.songs = _make_collection(5)

    def test_prev_retrieves_from_history(self):
        player, profile = _player_with_profile()
        player.play_collection(self.collection)
        first_current = player.current_collection_song
        player.advance()
        current_before_prev = player.current_collection_song
        count_before = QueueItem.objects.filter(queue=player.queue).count()

        result = player.prev()

        player.refresh_from_db()
        assert result is not None
        assert result.song == first_current.song
        assert QueueItem.objects.filter(queue=player.queue).count() == count_before + 1
        reinserted = (
            QueueItem.objects.filter(queue=player.queue).order_by("position").first()
        )
        assert reinserted.collection_song == current_before_prev

    def test_prev_multi_step(self):
        player, profile = _player_with_profile()
        player.play_collection(self.collection)

        played = [player.current_collection_song]
        player.advance()
        played.append(player.current_collection_song)
        player.advance()

        prev1 = player.prev()
        prev2 = player.prev()

        assert prev1.song == played[1].song
        assert prev2.song == played[0].song
        player.refresh_from_db()
        assert player.history_cursor == 2

    def test_prev_without_current_song_does_not_reinsert(self):
        player, profile = _player_with_profile()
        player.play_collection(self.collection)
        player.advance()
        player.current_collection_song = None
        player.save()

        count_before = QueueItem.objects.filter(queue=player.queue).count()
        player.prev()

        assert QueueItem.objects.filter(queue=player.queue).count() == count_before

    def test_prev_on_empty_history_returns_none(self):
        player, profile = _player_with_profile()
        result = player.prev()

        assert result is None


class TestPlayerClear(TestCase):
    def test_clear_empties_queue_preserves_context(self):
        collection, songs = _make_collection(3)
        player = PlayerStateFactory()
        player.play_collection(collection)
        player.refresh_from_db()

        current_song = player.current_collection_song
        extra = CollectionSongFactory()
        player.queue.insert_song(extra, position=Decimal("999999"))

        player.clear()

        player.refresh_from_db()
        player.context.refresh_from_db()
        assert player.current_collection_song == current_song
        assert player.context.collection == collection
        assert player.history_cursor == 0
        assert QueueItem.objects.filter(queue=player.queue).count() == 0
        assert QueueSource.objects.filter(queue=player.queue).count() == 0


class TestIsEmpty(TestCase):
    def test_empty(self):
        player = PlayerStateFactory()
        assert player.is_empty()

    def test_not_empty_with_current_song(self):
        player = PlayerStateFactory()
        player.current_collection_song = CollectionSongFactory()
        player.save()
        assert not player.is_empty()

    def test_not_empty_with_items(self):
        player = PlayerStateFactory()
        player.queue.insert_song(CollectionSongFactory(), position=Decimal("1000"))
        assert not player.is_empty()

    def test_empty_with_context_songs_but_no_queue_or_current(self):
        player = PlayerStateFactory()
        collection, _ = _make_collection(3)
        player.context.setup(collection, -1)

        assert player.is_empty()


class TestAdvanceFlow(TestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.collection, cls.songs = _make_collection(3)

    def test_advance_drains_queue_then_context_then_stops(self):
        player = PlayerStateFactory()
        queued = CollectionSongFactory()
        player.queue.insert_song(queued, position=Decimal("1000"))
        player.context.setup(self.collection, -1)

        first = player.advance()
        assert first == queued

        second = player.advance()
        assert second == self.songs[0]

        third = player.advance()
        assert third == self.songs[1]

        fourth = player.advance()
        assert fourth == self.songs[2]

        fifth = player.advance()
        assert fifth is None
