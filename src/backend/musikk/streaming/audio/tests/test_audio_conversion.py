import shutil
import tempfile
from pathlib import Path

from django.test import TestCase

from streaming.audio.ffmpeg_conf.ffmpeg_wrapper import FFMPEGFlacOnly, FFMPEGFull


class TestFFMPEGConversion(TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        super().setUpClass()
        tests_dir = Path(__file__).parent
        cls.input_file = tests_dir / "data" / "file1.wav"
        assert cls.input_file.exists(), f"Test input_file not found: {cls.input_file}"

    def test_flac_conversion_creates_files(self):
        with tempfile.TemporaryDirectory() as output_dir:
            results = FFMPEGFlacOnly.convert_audio(
                file_path=self.input_file, output_dir=output_dir
            )
            self.assertIsInstance(results, list)
            self.assertTrue(len(results) > 0, "No files were returned from convert_audio")
            for path in results:
                self.assertTrue(
                    Path(path).exists(),
                    f"Expected converted file to exist: {path}",
                )

    def test_all_codecs_convert(self):
        with tempfile.TemporaryDirectory() as output_dir:
            results = FFMPEGFull.convert_audio(
                file_path=self.input_file, output_dir=output_dir
            )
            self.assertIsInstance(results, list)
            self.assertEqual(len(results), 5, "Expected 5 converted files from FFMPEGFull")
            for path in results:
                self.assertTrue(
                    Path(path).exists(),
                    f"Expected converted file to exist: {path}",
                )
