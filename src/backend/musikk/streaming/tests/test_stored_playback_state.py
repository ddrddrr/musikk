from decimal import Decimal
from unittest.mock import patch
from uuid import UUID

from django.test import TestCase
from users.tests.factories import BaseUserFactory

from streaming.models import (
    Collection,
    PlaybackQueue,
    QueueItem,
    QueueSource,
    StoredPlaybackState,
)
from streaming.models.stored_playback_state import PLAYING_PAST_END_MARGIN_MS
from streaming.tests.factories import (
    CollectionSongFactory,
    StoredPlaybackStateFactory,
    make_collection,
)

NOW_SERVER_MS = 1_700_000_010_000
SONG_DURATION_MS = 180_000
PREV_PLAY_ITEM_UNIQUE_ID = "22222222-2222-2222-2222-222222222222"
EMPTY_PLAY_STATE = {
    "curr_play_item_unique_id": None,
    "last_known_is_playing": False,
    "last_known_song_pos_ms": 0,
    "last_known_song_pos_updated_at_server_ms": 0,
}


def _stored_playback_state_with_profile():
    user = BaseUserFactory()
    profile = user.streamingprofile
    return profile.stored_playback_state, profile


class TestPlay(TestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.collection, cls.songs = make_collection(5)

    def test_play_collection(self):
        stored_playback_state = StoredPlaybackStateFactory()

        stored_playback_state.play_collection(self.collection)

        stored_playback_state.refresh_from_db()
        stored_playback_state.collection_cursor.refresh_from_db()
        assert stored_playback_state.current_collection_song == self.songs[0]
        assert stored_playback_state.collection_cursor.collection == self.collection
        assert stored_playback_state.collection_cursor.cursor == self.songs[0].position

    def test_play_song_resets_context(self):
        stored_playback_state, _ = _stored_playback_state_with_profile()
        stored_playback_state.play_collection(self.collection)

        other_collection, other_songs = make_collection(3)
        target = other_songs[1]
        stored_playback_state.play_song(target)

        stored_playback_state.refresh_from_db()
        stored_playback_state.collection_cursor.refresh_from_db()
        assert stored_playback_state.current_collection_song == target
        assert stored_playback_state.collection_cursor.collection == other_collection
        assert stored_playback_state.collection_cursor.cursor == target.position

    def test_play_empty_collection_does_nothing(self):
        stored_playback_state = StoredPlaybackStateFactory()
        stored_playback_state.play_song(self.songs[0])
        stored_playback_state.refresh_from_db()

        empty = Collection.objects.create(type="playlist", title="Empty")
        stored_playback_state.play_collection(empty)

        stored_playback_state.refresh_from_db()
        assert stored_playback_state.current_collection_song == self.songs[0]


class TestAdvanceAndChoose(TestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.collection, cls.songs = make_collection(10)

    def test_choose_sets_current_and_removes_items_before(self):
        stored_playback_state = StoredPlaybackStateFactory()
        stored_playback_state.playback_queue.append_collection(self.collection)

        items = list(
            QueueItem.objects.filter(
                queue=stored_playback_state.playback_queue
            ).order_by("position")
        )
        middle = items[4]
        result = stored_playback_state.choose_queue_song(middle)

        stored_playback_state.refresh_from_db()
        assert result == middle.collection_song
        assert stored_playback_state.current_collection_song == middle.collection_song
        remaining = list(
            QueueItem.objects.filter(
                queue=stored_playback_state.playback_queue
            ).order_by("position")
        )
        for item in remaining:
            assert item.position > middle.position

    def test_choose_resets_history_cursor(self):
        stored_playback_state, profile = _stored_playback_state_with_profile()
        stored_playback_state.play_collection(self.collection)
        stored_playback_state.advance()
        stored_playback_state.prev()
        assert stored_playback_state.history_cursor == 1

        s1 = CollectionSongFactory()
        item = stored_playback_state.playback_queue.insert_song(
            s1, position=Decimal("1000")
        )
        stored_playback_state.choose_queue_song(item)

        stored_playback_state.refresh_from_db()
        assert stored_playback_state.history_cursor == 0


class TestPrev(TestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.collection, cls.songs = make_collection(5)

    def test_prev_retrieves_from_history(self):
        stored_playback_state, profile = _stored_playback_state_with_profile()
        stored_playback_state.play_collection(self.collection)
        first_current = stored_playback_state.current_collection_song
        stored_playback_state.advance()
        current_before_prev = stored_playback_state.current_collection_song
        count_before = QueueItem.objects.filter(
            queue=stored_playback_state.playback_queue
        ).count()

        result = stored_playback_state.prev()

        stored_playback_state.refresh_from_db()
        assert result is not None
        assert result.song == first_current.song
        assert (
            QueueItem.objects.filter(queue=stored_playback_state.playback_queue).count()
            == count_before + 1
        )
        reinserted = (
            QueueItem.objects.filter(queue=stored_playback_state.playback_queue)
            .order_by("position")
            .first()
        )
        assert reinserted.collection_song == current_before_prev

    def test_prev_into_empty_queue_keeps_later_appends_after_the_reinserted_song(
        self,
    ):
        stored_playback_state, _ = _stored_playback_state_with_profile()
        stored_playback_state.play_collection(self.collection)
        stored_playback_state.advance()
        reinserted_song = stored_playback_state.current_collection_song
        stored_playback_state.prev()

        # a fresh queue, as the next request loads it from the database
        PlaybackQueue.objects.get(pk=stored_playback_state.playback_queue_id).append(
            self.songs[4]
        )

        items = list(
            QueueItem.objects.filter(
                queue=stored_playback_state.playback_queue
            ).order_by("position")
        )
        assert [item.collection_song for item in items] == [
            reinserted_song,
            self.songs[4],
        ]
        assert items[0].position < items[1].position

    def test_prev_multi_step(self):
        stored_playback_state, profile = _stored_playback_state_with_profile()
        stored_playback_state.play_collection(self.collection)

        played = [stored_playback_state.current_collection_song]
        stored_playback_state.advance()
        played.append(stored_playback_state.current_collection_song)
        stored_playback_state.advance()

        prev1 = stored_playback_state.prev()
        prev2 = stored_playback_state.prev()

        assert prev1.song == played[1].song
        assert prev2.song == played[0].song
        stored_playback_state.refresh_from_db()
        assert stored_playback_state.history_cursor == 2

    def test_prev_without_current_song_does_not_reinsert(self):
        stored_playback_state, profile = _stored_playback_state_with_profile()
        stored_playback_state.play_collection(self.collection)
        stored_playback_state.advance()
        stored_playback_state.current_collection_song = None
        stored_playback_state.save()

        count_before = QueueItem.objects.filter(
            queue=stored_playback_state.playback_queue
        ).count()
        stored_playback_state.prev()

        assert (
            QueueItem.objects.filter(queue=stored_playback_state.playback_queue).count()
            == count_before
        )

    def test_prev_on_empty_history_returns_none(self):
        stored_playback_state, profile = _stored_playback_state_with_profile()
        result = stored_playback_state.prev()

        assert result is None


class TestStoredPlaybackStateClear(TestCase):
    def test_clear_empties_queue_preserves_context(self):
        collection, songs = make_collection(3)
        stored_playback_state = StoredPlaybackStateFactory()
        stored_playback_state.play_collection(collection)
        stored_playback_state.refresh_from_db()

        current_song = stored_playback_state.current_collection_song
        extra = CollectionSongFactory()
        stored_playback_state.playback_queue.insert_song(
            extra, position=Decimal("999999")
        )

        stored_playback_state.clear()

        stored_playback_state.refresh_from_db()
        stored_playback_state.collection_cursor.refresh_from_db()
        assert stored_playback_state.current_collection_song == current_song
        assert stored_playback_state.collection_cursor.collection == collection
        assert stored_playback_state.history_cursor == 0
        assert (
            QueueItem.objects.filter(queue=stored_playback_state.playback_queue).count()
            == 0
        )
        assert (
            QueueSource.objects.filter(
                queue=stored_playback_state.playback_queue
            ).count()
            == 0
        )


class TestIsEmpty(TestCase):
    def test_empty(self):
        stored_playback_state = StoredPlaybackStateFactory()
        assert stored_playback_state.is_empty()

    def test_not_empty_with_current_song(self):
        stored_playback_state = StoredPlaybackStateFactory()
        stored_playback_state.current_collection_song = CollectionSongFactory()
        stored_playback_state.save()
        assert not stored_playback_state.is_empty()

    def test_not_empty_with_items(self):
        stored_playback_state = StoredPlaybackStateFactory()
        stored_playback_state.playback_queue.insert_song(
            CollectionSongFactory(), position=Decimal("1000")
        )
        assert not stored_playback_state.is_empty()

    def test_empty_with_context_songs_but_no_queue_or_current(self):
        stored_playback_state = StoredPlaybackStateFactory()
        collection, _ = make_collection(3)
        stored_playback_state.collection_cursor.setup(collection, -1)

        assert stored_playback_state.is_empty()


class TestAdvanceFlow(TestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.collection, cls.songs = make_collection(3)

    def test_advance_drains_queue_then_context_then_stops(self):
        stored_playback_state, _ = _stored_playback_state_with_profile()
        queued = CollectionSongFactory()
        stored_playback_state.playback_queue.insert_song(
            queued, position=Decimal("1000")
        )
        stored_playback_state.collection_cursor.setup(self.collection, -1)

        first = stored_playback_state.advance()
        assert first == queued

        second = stored_playback_state.advance()
        assert second == self.songs[0]

        third = stored_playback_state.advance()
        assert third == self.songs[1]

        fourth = stored_playback_state.advance()
        assert fourth == self.songs[2]

        fifth = stored_playback_state.advance()
        assert fifth is None


class PlayStateTestCase(TestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.user = BaseUserFactory.create()
        cls.collection_song = CollectionSongFactory.create(
            song__duration_ms=SONG_DURATION_MS
        )

    def setUp(self):
        self.now_patcher = patch(
            "streaming.models.stored_playback_state.now_server_ms",
            return_value=NOW_SERVER_MS,
        )
        self.now_patcher.start()
        self.addCleanup(self.now_patcher.stop)

        self.stored_playback_state = self._load_stored_playback_state()
        self.stored_playback_state.current_collection_song = self.collection_song
        self.stored_playback_state.save()

    def _load_stored_playback_state(self) -> StoredPlaybackState:
        return StoredPlaybackState.objects.get(streamingprofile__user=self.user)

    def _play_state(self, **overrides) -> dict:
        values = {
            "curr_play_item_unique_id": UUID(PREV_PLAY_ITEM_UNIQUE_ID),
            "last_known_is_playing": True,
            "last_known_song_pos_ms": 10_000,
            "last_known_song_pos_updated_at_server_ms": NOW_SERVER_MS - 4_000,
        }
        values.update(overrides)
        return values

    def _set_prev(self, **overrides) -> None:
        for field, value in self._play_state(**overrides).items():
            setattr(self.stored_playback_state, field, value)
        self.stored_playback_state.save()

    def _stored_play_state(self) -> dict:
        stored_playback_state = self._load_stored_playback_state()
        return {
            field: getattr(stored_playback_state, field) for field in self._play_state()
        }


class TestIsPlaying(PlayStateTestCase):
    def test_playing_state_on_the_row_reads_as_playing(self):
        self._set_prev()

        stored_playback_state = self._load_stored_playback_state()
        assert stored_playback_state.has_curr_play_item()
        assert stored_playback_state.is_playing()

    def test_row_without_a_play_item_is_not_playing(self):
        self._set_prev(curr_play_item_unique_id=None)

        stored_playback_state = self._load_stored_playback_state()
        assert not stored_playback_state.has_curr_play_item()
        assert not stored_playback_state.is_playing()

    def test_row_whose_song_was_deleted_is_not_playing(self):
        self._set_prev()
        song_to_delete = CollectionSongFactory.create()
        self.stored_playback_state.current_collection_song = song_to_delete
        self.stored_playback_state.save()

        song_to_delete.delete()

        stored_playback_state = self._load_stored_playback_state()
        assert not stored_playback_state.has_curr_play_item()
        assert not stored_playback_state.is_playing()

    def test_playing_past_the_song_end_and_the_margin_reads_as_paused(self):
        # a Daphne restart skipped `disconnect()`, so nobody paused the row
        long_ago_ms = NOW_SERVER_MS - SONG_DURATION_MS - PLAYING_PAST_END_MARGIN_MS
        self._set_prev(last_known_song_pos_updated_at_server_ms=long_ago_ms)

        assert not self._load_stored_playback_state().is_playing()
        assert self._stored_play_state() == self._play_state(
            last_known_song_pos_updated_at_server_ms=long_ago_ms
        )

    def test_playing_inside_the_margin_stays_playing(self):
        # the song is just ending, or the audio fell a few seconds behind
        self._set_prev(
            last_known_song_pos_updated_at_server_ms=NOW_SERVER_MS - SONG_DURATION_MS
        )

        assert self._load_stored_playback_state().is_playing()

    def test_playing_a_song_without_a_known_length_stays_playing(self):
        song_without_duration = CollectionSongFactory.create(song__duration_ms=None)
        self.stored_playback_state.current_collection_song = song_without_duration
        self._set_prev(last_known_song_pos_updated_at_server_ms=0)

        assert self._load_stored_playback_state().is_playing()


class TestSongChangeStartsNewPlayItem(PlayStateTestCase):
    """
    `curr_play_item_unique_id` is the FE's signal for "this is a new play of a song".

    It is minted fresh on every song change, even when the same song is queued
    several times in a row. Reports and seeks carry it, so the server can drop the
    ones that were meant for the previous play.
    """

    def _assert_new_play_item_at_start(self, is_playing: bool = True) -> None:
        stored_play_state = self._stored_play_state()
        self.assertNotEqual(
            stored_play_state["curr_play_item_unique_id"],
            UUID(PREV_PLAY_ITEM_UNIQUE_ID),
        )
        self.assertEqual(
            stored_play_state,
            self._play_state(
                curr_play_item_unique_id=stored_play_state["curr_play_item_unique_id"],
                last_known_is_playing=is_playing,
                last_known_song_pos_ms=0,
                last_known_song_pos_updated_at_server_ms=NOW_SERVER_MS,
            ),
        )

    def test_playing_the_same_song_again_starts_a_new_play_item(self):
        self._set_prev()

        self.stored_playback_state.play_song(self.collection_song)

        self._assert_new_play_item_at_start()

    def test_advance_to_another_song_starts_a_new_play_item(self):
        self._set_prev()
        other_song = CollectionSongFactory.create()
        self.stored_playback_state.playback_queue.append(other_song)

        self.stored_playback_state.advance()

        self.assertEqual(
            self._load_stored_playback_state().current_collection_song, other_song
        )
        self._assert_new_play_item_at_start()

    def test_advance_keeps_a_paused_song_paused(self):
        self._set_prev(last_known_is_playing=False)
        self.stored_playback_state.playback_queue.append(CollectionSongFactory.create())

        self.stored_playback_state.advance()

        self._assert_new_play_item_at_start(is_playing=False)

    def test_two_song_changes_start_distinct_play_items(self):
        self.stored_playback_state.play_song(self.collection_song)
        first = self._load_stored_playback_state().curr_play_item_unique_id
        self.stored_playback_state.play_song(self.collection_song)
        second = self._load_stored_playback_state().curr_play_item_unique_id

        self.assertNotEqual(first, second)

    def test_advance_from_a_long_song_near_its_end_to_a_short_song_keeps_playing(
        self,
    ):
        # the play state is read before the song changes, so the 5 min position
        # is not compared with the 1 min length of the next song
        self.stored_playback_state.current_collection_song = (
            CollectionSongFactory.create(song__duration_ms=600_000)
        )
        self._set_prev(
            last_known_song_pos_ms=300_000,
            last_known_song_pos_updated_at_server_ms=NOW_SERVER_MS,
        )
        self.stored_playback_state.playback_queue.append(
            CollectionSongFactory.create(song__duration_ms=60_000)
        )

        self.stored_playback_state.advance()

        assert self._load_stored_playback_state().is_playing()

    def test_prev_starts_a_new_play_item(self):
        self.stored_playback_state.playback_queue.append(CollectionSongFactory.create())
        self.stored_playback_state.advance()
        self._set_prev()

        self.stored_playback_state.prev()

        self.assertEqual(
            self._load_stored_playback_state().current_collection_song.song,
            self.collection_song.song,
        )
        self._assert_new_play_item_at_start()

    def test_advance_past_the_last_song_clears_the_play_state(self):
        self._set_prev()

        self.stored_playback_state.advance()

        self.assertIsNone(self._load_stored_playback_state().current_collection_song)
        self.assertEqual(self._stored_play_state(), EMPTY_PLAY_STATE)


class TestApplyPlayReport(PlayStateTestCase):
    def test_report_replaces_play_state_and_position(self):
        self._set_prev(last_known_is_playing=True)

        applied = self._load_stored_playback_state().apply_play_report(
            curr_play_item_unique_id=PREV_PLAY_ITEM_UNIQUE_ID,
            is_playing=False,
            song_pos_ms=42_500,
        )

        assert applied
        self.assertEqual(
            self._stored_play_state(),
            self._play_state(
                last_known_is_playing=False,
                last_known_song_pos_ms=42_500,
                last_known_song_pos_updated_at_server_ms=NOW_SERVER_MS,
            ),
        )

    def test_report_for_stale_play_item_is_dropped(self):
        # the active device reported before it loaded the song the user moved to
        self._set_prev()

        applied = self._load_stored_playback_state().apply_play_report(
            curr_play_item_unique_id="old-uuid", is_playing=False, song_pos_ms=42_500
        )

        assert not applied
        self.assertEqual(self._stored_play_state(), self._play_state())

    def test_report_is_dropped_when_nothing_is_stored(self):
        applied = self._load_stored_playback_state().apply_play_report(
            curr_play_item_unique_id=PREV_PLAY_ITEM_UNIQUE_ID,
            is_playing=True,
            song_pos_ms=0,
        )

        assert not applied
        self.assertEqual(self._stored_play_state(), EMPTY_PLAY_STATE)

    def test_report_is_dropped_when_no_song_is_loaded(self):
        self._set_prev()
        self.stored_playback_state.current_collection_song = None
        self.stored_playback_state.save()

        applied = self._load_stored_playback_state().apply_play_report(
            curr_play_item_unique_id=PREV_PLAY_ITEM_UNIQUE_ID,
            is_playing=True,
            song_pos_ms=0,
        )

        assert not applied
        self.assertEqual(self._stored_play_state(), self._play_state())


class TestPauseAtEstimatedPosition(PlayStateTestCase):
    def test_pause_moves_a_playing_position_forward_by_the_time_passed(self):
        self._set_prev(last_known_is_playing=True)

        self._load_stored_playback_state().pause_at_estimated_position()

        self.assertEqual(
            self._stored_play_state(),
            self._play_state(
                last_known_is_playing=False,
                last_known_song_pos_ms=14_000,
                last_known_song_pos_updated_at_server_ms=NOW_SERVER_MS,
            ),
        )

    def test_pause_keeps_a_paused_position(self):
        self._set_prev(last_known_is_playing=False)

        self._load_stored_playback_state().pause_at_estimated_position()

        self.assertEqual(
            self._stored_play_state(),
            self._play_state(
                last_known_is_playing=False,
                last_known_song_pos_ms=10_000,
                last_known_song_pos_updated_at_server_ms=NOW_SERVER_MS,
            ),
        )

    def test_pause_past_the_song_end_keeps_the_stored_position(self):
        long_ago_ms = NOW_SERVER_MS - SONG_DURATION_MS - PLAYING_PAST_END_MARGIN_MS
        self._set_prev(last_known_song_pos_updated_at_server_ms=long_ago_ms)

        self._load_stored_playback_state().pause_at_estimated_position()

        self.assertEqual(
            self._stored_play_state(),
            self._play_state(
                last_known_is_playing=False,
                last_known_song_pos_ms=10_000,
                last_known_song_pos_updated_at_server_ms=NOW_SERVER_MS,
            ),
        )

    def test_pause_is_noop_when_nothing_is_stored(self):
        self._load_stored_playback_state().pause_at_estimated_position()

        self.assertEqual(self._stored_play_state(), EMPTY_PLAY_STATE)
