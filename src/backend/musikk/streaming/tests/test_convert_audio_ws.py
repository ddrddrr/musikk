from unittest.mock import patch, Mock
import tempfile

from django.test import TestCase

from streaming.tests.factories import BaseSongFactory
from users.tests.factories import BaseUserFactory, ArtistProfileFactory

from streaming.audio.tasks import convert_audio
from streaming.audio.shaka_packager_conf.shaka_packager_wrapper import ManifestType


class ConvertAudioWebsocketEventTest(TestCase):
    def setUp(self):
        self.user = BaseUserFactory.create()
        ArtistProfileFactory(user=self.user)
        self.song = BaseSongFactory.create()

    @patch("streaming.audio.tasks.AudioProcessingPipeline.run")
    @patch("streaming.audio.tasks.get_channel_layer")
    @patch("streaming.audio.tasks.default_storage")
    def test_convert_audio_sends_song_created_event_to_initiator(
        self, mock_default_storage, mock_get_channel_layer, mock_pipeline_run
    ):
        """
        Ensure that after convert_audio finishes it sends a Channels group_send
        to the initiator's group "user_{initiator_uuid}" with type "song.created".
        """

        song_repr = Mock()
        song_repr.content_path = "audio/content/path"
        song_repr.manifests = {
            ManifestType.MPD: "path/to/manifest.mpd",
            ManifestType.M3U8: "path/to/playlist.m3u8",
        }
        mock_pipeline_run.return_value = Mock(song_repr=song_repr)

        mock_default_storage.url.side_effect = (
            lambda path: f"https://storage.example/{path}"
        )

        fake_layer = Mock()
        fake_layer.group_send = Mock()
        mock_get_channel_layer.return_value = fake_layer

        with tempfile.NamedTemporaryFile(delete=False) as tmp:
            temp_path = tmp.name

        convert_audio.delay(
            file_path=temp_path,
            song_uuid=str(self.song.uuid),
            initiator_uuid=str(self.user.uuid),
            delete_orig_file=False,
        )

        expected_group = f"user_{self.user.uuid}"

        fake_layer.group_send.assert_called_once_with(
            expected_group,
            {"type": "song.created"},
        )
