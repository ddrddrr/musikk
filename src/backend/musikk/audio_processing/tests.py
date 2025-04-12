import os
from pathlib import Path
import shutil

from django.test import TestCase
from django.conf import settings

from audio_processing.ffmpeg_wrapper import FFMPEGWrapper
from audio_processing.converters import (
    FLAC_CONVERTER,
    AACHEv2_CONVERTER,
    OPUS_CONVERTER,
)

# settings.AUDIO_CONTENT_PATH = "/tmp/musikk_tests"

AUDIO_PATH_1 = os.path.expanduser("~/studies/musikk/sample-9s.wav")
AUDIO_PATH_2 = os.path.expanduser("~/studies/musikk/sample-6s.wav")


class TestFFMPEGWrapper(TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        super().setUpClass()

        with open(AUDIO_PATH_1, "rb") as f:
            cls.audio_1 = f.read()

        with open(AUDIO_PATH_1, "rb") as f:
            cls.audio_2 = f.read()

    def test_convert_flac_basic(self):
        ffmpeg = FFMPEGWrapper().add_converter(FLAC_CONVERTER)

        ret = ffmpeg.convert_song(self.audio_1)
        assert ret
        assert ret.manifests["mpd_path"]
        assert Path(ret.manifests["mpd_path"]).exists()

    def test_convert_multiple_encoders(self):
        ffmpeg = (
            FFMPEGWrapper()
            .add_converter(FLAC_CONVERTER)
            .add_converter(AACHEv2_CONVERTER)
            .add_converter(OPUS_CONVERTER)
        )
        ret = ffmpeg.convert_song(self.audio_1)
        assert ret
        assert ret.manifests["mpd_path"]
        assert Path(ret.manifests["mpd_path"]).exists()

    # TODO: check that mpd has the correct structure
    # @classmethod
    # def tearDownClass(cls) -> None:
    #     shutil.rmtree(Path(settings.AUDIO_CONTENT_PATH))
