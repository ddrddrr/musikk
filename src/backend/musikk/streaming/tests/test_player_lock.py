import threading
import time
from collections.abc import Callable
from functools import partial
from unittest.mock import Mock, patch

from django.db import connection, connections
from django.test import TransactionTestCase
from users.tests.factories import BaseUserFactory
from utils.clock import now_server_ms

from streaming.models import StoredPlaybackState
from streaming.models.stored_playback_state import locked_stored_playback_state
from streaming.tests.factories import CollectionSongFactory
from streaming.ws.action_handlers.playback import PlaybackWSActionHandler
from streaming.ws.player_controller import PlayerController
from streaming.ws.state_broadcasters.playback import PlaybackStateBroadcaster

TIMEOUT_S = 5
OLD_PLAY_ITEM_UNIQUE_ID = "22222222-2222-2222-2222-222222222222"
ACTIVE_DEVICE_ID = "active-device"


def _play_state(stored_playback_state: StoredPlaybackState) -> dict:
    return {
        "current_collection_song_id": stored_playback_state.current_collection_song_id,
        "curr_play_item_unique_id": str(stored_playback_state.curr_play_item_unique_id),
        "is_playing": stored_playback_state.is_playing(),
        "last_known_song_pos_ms": stored_playback_state.last_known_song_pos_ms,
        "last_known_song_pos_updated_at_server_ms": (
            stored_playback_state.last_known_song_pos_updated_at_server_ms
        ),
    }


class DatabaseThread(threading.Thread):
    """Runs `target` on its own database connection, like a request thread.

    An error in the thread is kept, so the test can raise it after `join`.
    """

    def __init__(self, target: Callable[[], object]):
        super().__init__(daemon=True)
        self._run_target = target
        self.error: BaseException | None = None

    def run(self) -> None:
        try:
            self._run_target()
        except BaseException as error:
            self.error = error
        finally:
            connections.close_all()


class SnapshotRecorder:
    """Stands in for `broadcast_snapshot`, so the tests see the order of the snapshots.

    The first caller stops in the snapshot until the test releases it. It still
    holds the row lock at that point, so the test can start a second caller that
    has to wait.
    """

    def __init__(self):
        self.snapshots: list[dict] = []
        self.first_snapshot_reached = threading.Event()
        self.release_first_snapshot = threading.Event()

    def record(self, stored_playback_state: StoredPlaybackState) -> None:
        self.snapshots.append(_play_state(stored_playback_state))
        if len(self.snapshots) == 1:
            self.first_snapshot_reached.set()
            self.release_first_snapshot.wait(TIMEOUT_S)


class TestStoredPlaybackStateLock(TransactionTestCase):
    """
    Runs two callers on two threads at the same time, as an HTTP request and a
    WebSocket handler do in production.

    `TestCase` runs each test in one transaction, so a second caller could never
    wait for the row lock there. These tests commit for real instead.
    """

    def setUp(self):
        # TransactionTestCase empties the tables after each test, so the rows
        # are made per test and not once per class
        self.user = BaseUserFactory.create()
        self.user_uuid = str(self.user.uuid)
        self.next_song = CollectionSongFactory.create()
        self.song_after_next = CollectionSongFactory.create()

        stored_playback_state = self._load_stored_playback_state()
        stored_playback_state.current_collection_song = CollectionSongFactory.create()
        stored_playback_state.curr_play_item_unique_id = OLD_PLAY_ITEM_UNIQUE_ID
        stored_playback_state.last_known_is_playing = True
        stored_playback_state.last_known_song_pos_ms = 10_000
        stored_playback_state.last_known_song_pos_updated_at_server_ms = now_server_ms()
        stored_playback_state.save()
        stored_playback_state.playback_queue.append(self.next_song)
        stored_playback_state.playback_queue.append(self.song_after_next)

        self.recorder = SnapshotRecorder()
        self.broadcast_snapshot_patcher = patch.object(
            PlaybackStateBroadcaster,
            "broadcast_snapshot",
            side_effect=self.recorder.record,
        )
        self.broadcast_queue_changed_patcher = patch.object(
            PlaybackStateBroadcaster, "broadcast_queue_changed"
        )
        self.device_manager_patcher = patch(
            "streaming.ws.action_handlers.playback.DeviceManager"
        )
        self.broadcast_snapshot_patcher.start()
        self.broadcast_queue_changed_patcher.start()
        mock_device_manager = self.device_manager_patcher.start().return_value
        mock_device_manager.get_active_device_id.return_value = ACTIVE_DEVICE_ID
        self.addCleanup(self.broadcast_snapshot_patcher.stop)
        self.addCleanup(self.broadcast_queue_changed_patcher.stop)
        self.addCleanup(self.device_manager_patcher.stop)

    def _load_stored_playback_state(self) -> StoredPlaybackState:
        return StoredPlaybackState.objects.get(streamingprofile__user=self.user)

    def _start_thread(self, target: Callable[[], object]) -> DatabaseThread:
        thread = DatabaseThread(target)
        self.addCleanup(thread.join, TIMEOUT_S)
        thread.start()
        return thread

    def _finish(self, *threads: DatabaseThread) -> None:
        for thread in threads:
            thread.join(TIMEOUT_S)
            self.assertFalse(thread.is_alive(), "a thread did not finish in time")
            if thread.error is not None:
                raise thread.error

    def _wait_for_a_query_blocked_by_a_lock(self) -> None:
        """Waits until another connection waits for a row lock.

        This is the moment the race happens. A query that has not started yet
        would make the test pass even without the lock.
        """
        deadline = time.monotonic() + TIMEOUT_S
        with connection.cursor() as cursor:
            while time.monotonic() < deadline:
                cursor.execute(
                    "SELECT count(*) FROM pg_stat_activity "
                    "WHERE datname = current_database() AND wait_event_type = 'Lock'"
                )
                if cursor.fetchone()[0] > 0:
                    return
                time.sleep(0.01)
        self.fail("no query started to wait for the row lock")

    def _write_position_and_hold_lock(
        self, holds_lock: threading.Event, release: threading.Event
    ) -> None:
        with locked_stored_playback_state(self.user_uuid) as stored_playback_state:
            stored_playback_state.last_known_song_pos_ms = 42_000
            stored_playback_state.save(update_fields=["last_known_song_pos_ms"])
            holds_lock.set()
            release.wait(TIMEOUT_S)

    def _read_position_under_lock(self, seen: list[int]) -> None:
        with locked_stored_playback_state(self.user_uuid) as stored_playback_state:
            seen.append(stored_playback_state.last_known_song_pos_ms)

    def _send_report(self, curr_play_item_unique_id: str) -> None:
        consumer = Mock()
        consumer.user_uuid = self.user_uuid
        consumer.device_id = ACTIVE_DEVICE_ID
        PlaybackWSActionHandler(consumer).handle_active_device_report(
            {
                "curr_play_item_unique_id": curr_play_item_unique_id,
                "is_playing": True,
                "song_pos_ms": 20_000,
            }
        )

    def test_second_caller_waits_and_then_reads_what_the_first_one_committed(self):
        holds_lock = threading.Event()
        release = threading.Event()
        seen: list[int] = []
        writer = self._start_thread(
            partial(self._write_position_and_hold_lock, holds_lock, release)
        )
        self.addCleanup(release.set)
        self.assertTrue(holds_lock.wait(TIMEOUT_S))

        reader = self._start_thread(partial(self._read_position_under_lock, seen))
        self._wait_for_a_query_blocked_by_a_lock()
        self.assertEqual(seen, [])

        release.set()
        self._finish(writer, reader)
        self.assertEqual(seen, [42_000])

    def test_report_sent_during_a_song_change_does_not_bring_back_the_old_song(self):
        # the report left the active tab before it loaded the next song
        song_change = self._start_thread(
            PlayerController(user_uuid=self.user_uuid).advance
        )
        self.addCleanup(self.recorder.release_first_snapshot.set)
        self.assertTrue(self.recorder.first_snapshot_reached.wait(TIMEOUT_S))

        report = self._start_thread(partial(self._send_report, OLD_PLAY_ITEM_UNIQUE_ID))
        self._wait_for_a_query_blocked_by_a_lock()

        self.recorder.release_first_snapshot.set()
        self._finish(song_change, report)

        stored_playback_state = self._load_stored_playback_state()
        self.assertEqual(
            stored_playback_state.current_collection_song_id, self.next_song.uuid
        )
        # the report was dropped, so the row still matches the only snapshot
        self.assertEqual(self.recorder.snapshots, [_play_state(stored_playback_state)])

    def test_two_song_changes_at_the_same_time_send_snapshots_in_order(self):
        # e.g. a song ends on one tab while the user clicks "next" on another
        first = self._start_thread(PlayerController(user_uuid=self.user_uuid).advance)
        self.addCleanup(self.recorder.release_first_snapshot.set)
        self.assertTrue(self.recorder.first_snapshot_reached.wait(TIMEOUT_S))

        second = self._start_thread(PlayerController(user_uuid=self.user_uuid).advance)
        self._wait_for_a_query_blocked_by_a_lock()

        self.recorder.release_first_snapshot.set()
        self._finish(first, second)

        self.assertEqual(
            [
                snapshot["current_collection_song_id"]
                for snapshot in self.recorder.snapshots
            ],
            [self.next_song.uuid, self.song_after_next.uuid],
        )
        self.assertEqual(
            self.recorder.snapshots[-1],
            _play_state(self._load_stored_playback_state()),
        )
