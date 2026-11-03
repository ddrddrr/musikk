import dataclasses
import os
import shutil
import subprocess
import tempfile
from unittest.mock import Mock, patch

from celery.exceptions import SoftTimeLimitExceeded
from django.conf import settings
from django.test import TestCase, override_settings
from users.tests.factories import ArtistFactory

from streaming.audio.exceptions import ProcessingTimeoutError
from streaming.audio.probes import AudioStreamInfo
from streaming.audio.shaka_packager_conf.shaka_packager_wrapper import ManifestType
from streaming.audio.tasks import convert_audio
from streaming.audio.upload_files import track_dir
from streaming.models.songs import BaseSong, SongStatus
from streaming.tests.factories import BaseSongFactory
from streaming.ws.events import ServerEvent


def _mock_result():
    song_repr = Mock()
    song_repr.content_path = "audio/content/path"
    song_repr.manifests = {
        ManifestType.MPD: "path/to/manifest.mpd",
        ManifestType.M3U8: "path/to/playlist.m3u8",
    }
    return Mock(song_repr=song_repr, loudness_lufs=-14.0, true_peak_dbtp=-1.5)


def _audio_info_dict():
    return dataclasses.asdict(
        AudioStreamInfo(
            duration_seconds=180.0,
            sample_rate=44100,
            channels=2,
            codec_name="mp3",
            bit_depth=None,
            bit_rate=320000,
        )
    )


@patch("streaming.audio.tasks.delete_django_storage_dir")
@patch("streaming.audio.tasks.send_ws_event")
@patch("streaming.audio.tasks.AudioProcessingPipeline.run")
class ConvertAudioTest(TestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.user = ArtistFactory.create()

    def setUp(self):
        self.upload_tmp = tempfile.mkdtemp()
        self.override = override_settings(
            UPLOAD_TMP_DIR=self.upload_tmp,
            FILE_UPLOAD_TEMP_DIR=os.path.join(self.upload_tmp, "incoming"),
        )
        self.override.enable()

    def tearDown(self):
        self.override.disable()
        shutil.rmtree(self.upload_tmp, ignore_errors=True)

    def _queued_song_with_source(self) -> BaseSong:
        song = BaseSongFactory.create(status=SongStatus.QUEUED, content_path="")
        folder = track_dir(song.uuid)
        folder.mkdir(parents=True)
        (folder / "source.mp3").write_bytes(b"audio")
        return song

    def _run(self, song: BaseSong) -> None:
        convert_audio(
            song_uuid=str(song.uuid),
            initiator_uuid=str(self.user.uuid),
            audio_info=_audio_info_dict(),
        )

    def _final_dir(self, song: BaseSong) -> str:
        return os.path.join(settings.AUDIO_CONTENT_PATH, str(song.uuid))

    def _sent_statuses(self, mock_ws) -> list[str]:
        return [
            c.kwargs["status"]
            for c in mock_ws.call_args_list
            if c.kwargs["event_name"] == ServerEvent.SONG_UPLOAD
        ]

    def test_success_marks_song_ready_and_deletes_track_folder(
        self, mock_pipeline, mock_ws, mock_delete_storage
    ):
        song = self._queued_song_with_source()
        mock_pipeline.return_value = _mock_result()

        self._run(song)

        song.refresh_from_db()
        self.assertEqual(song.status, SongStatus.READY)
        self.assertEqual(song.mpd, "path/to/manifest.mpd")
        self.assertEqual(song.m3u8, "path/to/playlist.m3u8")
        self.assertEqual(song.content_path, "audio/content/path")
        self.assertEqual(song.duration_ms, 180_000)
        self.assertFalse(track_dir(song.uuid).exists())
        self.assertEqual(self._sent_statuses(mock_ws), ["processing", "ready"])
        mock_delete_storage.assert_not_called()

    def test_second_run_on_same_song_does_no_work(
        self, mock_pipeline, mock_ws, mock_delete_storage
    ):
        song = self._queued_song_with_source()
        mock_pipeline.return_value = _mock_result()

        self._run(song)
        self._run(song)

        mock_pipeline.assert_called_once()
        song.refresh_from_db()
        self.assertEqual(song.status, SongStatus.READY)

    def test_run_while_another_run_processes_keeps_the_track_folder(
        self, mock_pipeline, mock_ws, mock_delete_storage
    ):
        song = self._queued_song_with_source()
        BaseSong.objects.filter(uuid=song.uuid).update(status=SongStatus.PROCESSING)

        self._run(song)

        mock_pipeline.assert_not_called()
        self.assertTrue(track_dir(song.uuid).exists())

    def test_pipeline_error_marks_song_failed_once(
        self, mock_pipeline, mock_ws, mock_delete_storage
    ):
        song = self._queued_song_with_source()
        mock_pipeline.side_effect = RuntimeError("processing failed")

        self._run(song)

        song.refresh_from_db()
        self.assertEqual(song.status, SongStatus.FAILED)
        self.assertEqual(song.status_detail, "Audio processing failed")
        self.assertFalse(track_dir(song.uuid).exists())
        self.assertEqual(self._sent_statuses(mock_ws), ["processing", "failed"])
        mock_delete_storage.assert_called_once_with(self._final_dir(song))

    def test_timeouts_mark_song_failed_with_timeout_detail(
        self, mock_pipeline, mock_ws, mock_delete_storage
    ):
        timeouts = (
            SoftTimeLimitExceeded(),
            subprocess.TimeoutExpired(cmd="ffmpeg", timeout=1),
            ProcessingTimeoutError("The processing time budget is used up"),
        )
        for exc in timeouts:
            with self.subTest(exc=type(exc).__name__):
                song = self._queued_song_with_source()
                mock_pipeline.side_effect = exc

                self._run(song)

                song.refresh_from_db()
                self.assertEqual(song.status, SongStatus.FAILED)
                self.assertEqual(song.status_detail, "Song processing timeout")
                self.assertFalse(track_dir(song.uuid).exists())

    def test_missing_source_file_marks_song_failed(
        self, mock_pipeline, mock_ws, mock_delete_storage
    ):
        song = BaseSongFactory.create(status=SongStatus.QUEUED)

        self._run(song)

        mock_pipeline.assert_not_called()
        song.refresh_from_db()
        self.assertEqual(song.status, SongStatus.FAILED)

    def test_ws_error_after_db_write_keeps_song_ready_with_its_files(
        self, mock_pipeline, mock_ws, mock_delete_storage
    ):
        song = self._queued_song_with_source()
        mock_pipeline.return_value = _mock_result()
        mock_ws.side_effect = ConnectionError("channel layer is down")

        self._run(song)

        song.refresh_from_db()
        self.assertEqual(song.status, SongStatus.READY)
        self.assertEqual(song.content_path, "audio/content/path")
        mock_delete_storage.assert_not_called()

    def test_song_deleted_during_processing_leaves_no_output(
        self, mock_pipeline, mock_ws, mock_delete_storage
    ):
        song = self._queued_song_with_source()

        def delete_song_then_finish(**kwargs):
            BaseSong.objects.filter(uuid=song.uuid).delete()
            return _mock_result()

        mock_pipeline.side_effect = delete_song_then_finish

        self._run(song)

        self.assertFalse(BaseSong.objects.filter(uuid=song.uuid).exists())
        mock_delete_storage.assert_called_once_with(self._final_dir(song))
        self.assertFalse(track_dir(song.uuid).exists())
        self.assertNotIn("ready", self._sent_statuses(mock_ws))
