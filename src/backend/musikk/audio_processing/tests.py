import os
from pathlib import Path

from django.test import TestCase

from audio_processing.ffmpeg_wrapper import FFMPEGWrapper, StreamingProtocol, Full
from audio_processing.converters import (
    FLAC_CONVERTER,
    AACHEv2_CONVERTER,
    OPUS_CONVERTER,
)

# settings.AUDIO_CONTENT_PATH = "/tmp/musikk_tests"

AUDIO_PATH_1 = os.path.expanduser("~/studies/musikk/samples/NHU05011023.wav")
AUDIO_PATH_2 = os.path.expanduser("~/studies/musikk/samples/Home-Odyssey-01Intro.flac")


class TestFFMPEGWrapper(TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        super().setUpClass()

        with open(AUDIO_PATH_1, "rb") as f:
            cls.audio_1 = f.read()

        with open(AUDIO_PATH_1, "rb") as f:
            cls.audio_2 = f.read()

    def test_convert_flac_basic(self):
        ffmpeg = FFMPEGWrapper().add_converter(StreamingProtocol.DASH, FLAC_CONVERTER)

        ret = ffmpeg.convert_song(self.audio_1)
        self.assertTrue(ret)
        self.assertTrue(ret.manifests[StreamingProtocol.DASH])
        self.assertTrue(Path(ret.manifests[StreamingProtocol.DASH]).exists())
        FFMPEGWrapper._cleanup(ret.song_content_path)

    def test_convert_multiple_encoders(self):
        ffmpeg = (
            FFMPEGWrapper()
            .add_converter(StreamingProtocol.DASH, FLAC_CONVERTER)
            .add_converter(StreamingProtocol.DASH, AACHEv2_CONVERTER)
            .add_converter(StreamingProtocol.DASH, OPUS_CONVERTER)
        )
        ret = ffmpeg.convert_song(self.audio_1)
        self.assertTrue(ret)
        self.assertTrue(ret.manifests[StreamingProtocol.DASH])
        self.assertTrue(Path(ret.manifests[StreamingProtocol.DASH]).exists())
        FFMPEGWrapper._cleanup(ret.song_content_path)

    def test_convert_full(self):
        ret = Full.convert_song(self.audio_2)
        self.assertTrue(ret)
        self.assertTrue(ret.manifests[StreamingProtocol.DASH])
        self.assertTrue(Path(ret.manifests[StreamingProtocol.DASH]).exists())
        self.assertTrue(ret.manifests[StreamingProtocol.HLS])
        self.assertTrue(Path(ret.manifests[StreamingProtocol.HLS]).exists())
        FFMPEGWrapper._cleanup(ret.song_content_path)

    # TODO: check that mpd has the correct structure
    # @classmethod
    # def tearDownClass(cls) -> None:
    #     shutil.rmtree(Path(settings.AUDIO_CONTENT_PATH))
