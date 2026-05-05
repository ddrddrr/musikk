import dataclasses
import tempfile
from unittest.mock import Mock, patch

from django.test import TestCase
from users.tests.factories import ArtistFactory

from streaming.audio.probes import AudioStreamInfo
from streaming.audio.shaka_packager_conf.shaka_packager_wrapper import ManifestType
from streaming.audio.tasks import convert_audio
from streaming.tests.factories import BaseSongFactory


def _mock_song_repr():
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


@patch("streaming.audio.tasks.send_ws_event")
@patch("streaming.audio.tasks.UploadManager")
@patch("streaming.audio.tasks.AudioProcessingPipeline.run")
class ConvertAudioTest(TestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.user = ArtistFactory.create()

    def test_sets_draft_false_after_success(
        self, mock_pipeline, mock_upload_mgr, mock_ws
    ):
        song = BaseSongFactory.create(draft=True)
        mock_pipeline.return_value = _mock_song_repr()

        with tempfile.NamedTemporaryFile(delete=False) as tmp:
            temp_path = tmp.name

        convert_audio(
            file_path=temp_path,
            song_uuid=str(song.uuid),
            audio_info=_audio_info_dict(),
            initiator_uuid=str(self.user.uuid),
            delete_orig_file=False,
        )

        song.refresh_from_db()
        self.assertFalse(song.draft)
        self.assertEqual(song.mpd, "path/to/manifest.mpd")
        self.assertEqual(song.m3u8, "path/to/playlist.m3u8")
        self.assertEqual(song.content_path, "audio/content/path")

    def test_draft_stays_true_on_processing_failure(
        self, mock_pipeline, mock_upload_mgr, mock_ws
    ):
        song = BaseSongFactory.create(draft=True)
        mock_pipeline.side_effect = RuntimeError("processing failed")

        with tempfile.NamedTemporaryFile(delete=False) as tmp:
            temp_path = tmp.name

        with self.assertRaises(RuntimeError):
            convert_audio(
                file_path=temp_path,
                song_uuid=str(song.uuid),
                audio_info=_audio_info_dict(),
                initiator_uuid=str(self.user.uuid),
                delete_orig_file=False,
            )

        song.refresh_from_db()
        self.assertTrue(song.draft)
