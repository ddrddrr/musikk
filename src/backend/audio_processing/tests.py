import os.path

from src.backend.audio_processing.ffmpeg_wrapper import FFMPEGWrapper
from src.backend.audio_processing.converters import FLAC_CONVERTER

class TestFFMPEGWrapper:
    def test_convert_basic(self):
        ffmpeg = FFMPEGWrapper().add_converter(FLAC_CONVERTER)

        audio_file_path = os.path.expandvars("~/studies/musikk/sample-9s.wav")
        with open(audio_file_path, "rb") as audio_file:
            ret = ffmpeg.convert_song(audio_file.read())
            pass