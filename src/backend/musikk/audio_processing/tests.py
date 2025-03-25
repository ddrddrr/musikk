from django.test import TestCase
import os

from audio_processing.ffmpeg_wrapper import FFMPEGWrapper
from audio_processing.converters import FLAC_CONVERTER

class TestFFMPEGWrapper(TestCase):
    def test_convert_basic(self):
        ffmpeg = FFMPEGWrapper().add_converter(FLAC_CONVERTER)

        # Use expanduser to handle '~'
        audio_file_path = os.path.expanduser("~/studies/musikk/sample-9s.wav")

        with open(audio_file_path, "rb") as audio_file:
            ret = ffmpeg.convert_song(audio_file.read())
            assert ret