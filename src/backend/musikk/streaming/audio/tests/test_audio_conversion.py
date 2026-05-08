import tempfile
from pathlib import Path

from django.test import TestCase

from streaming.audio.config import DEFAULT_LOSSY_BITRATE
from streaming.audio.ffmpeg_conf.ffmpeg_wrapper import FFMPEGFlacOnly, FFMPEGFull
from streaming.audio.probes import AudioStreamInfo, get_audio_metadata


def _make_info(**overrides) -> AudioStreamInfo:
    defaults = {
        "duration_seconds": 180.0,
        "sample_rate": 44100,
        "channels": 2,
        "codec_name": "pcm_s16le",
        "bit_depth": 16,
        "bit_rate": None,
    }
    defaults.update(overrides)
    return AudioStreamInfo(**defaults)


class TestFFMPEGConversion(TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        super().setUpClass()
        tests_dir = Path(__file__).parent
        cls.input_file = tests_dir / "data" / "file1.wav"
        assert cls.input_file.exists(), f"Test input_file not found: {cls.input_file}"
        cls.audio_info = get_audio_metadata(cls.input_file)

    def test_flac_conversion_creates_files(self):
        with tempfile.TemporaryDirectory() as output_dir:
            results = FFMPEGFlacOnly.convert_audio(
                file_path=self.input_file,
                output_dir=output_dir,
                audio_info=self.audio_info,
            )
            self.assertIsInstance(results, list)
            self.assertTrue(
                len(results) > 0, "No files were returned from convert_audio"
            )
            for path in results:
                self.assertTrue(
                    Path(path).exists(),
                    f"Expected converted file to exist: {path}",
                )

    def test_all_codecs_convert(self):
        with tempfile.TemporaryDirectory() as output_dir:
            results = FFMPEGFull.convert_audio(
                file_path=self.input_file,
                output_dir=output_dir,
                audio_info=self.audio_info,
            )
            self.assertIsInstance(results, list)
            self.assertEqual(
                len(results), 5, "Expected 5 converted files from FFMPEGFull"
            )
            for path in results:
                self.assertTrue(
                    Path(path).exists(),
                    f"Expected converted file to exist: {path}",
                )


# TODO: add tests with lossy files (MP3/Opus)
class TestConverterSelection(TestCase):
    def test_lossless_source_returns_all_converters(self):
        info = _make_info(codec_name="pcm_s16le")
        selected = FFMPEGFull._select_converters(info)
        self.assertEqual(len(selected), 5)

    def test_lossy_source_skips_lossless(self):
        info = _make_info(codec_name="mp3", bit_rate=320_000)
        selected = FFMPEGFull._select_converters(info)
        for c in selected:
            self.assertFalse(c.lossless)

    def test_lossy_source_skips_higher_bitrate_tiers(self):
        info = _make_info(codec_name="mp3", bit_rate=128_000)
        selected = FFMPEGFull._select_converters(info)
        for c in selected:
            if c.bitrate is not None:
                self.assertLessEqual(c.bitrate, 128)

    def test_lossy_no_bitrate_uses_default(self):
        info = _make_info(codec_name="mp3", bit_rate=None)
        selected = FFMPEGFull._select_converters(info)
        for c in selected:
            if c.bitrate is not None:
                self.assertLessEqual(c.bitrate, DEFAULT_LOSSY_BITRATE)

    def test_lossy_very_low_bitrate_returns_lowest_tier_only(self):
        info = _make_info(codec_name="aac", bit_rate=24_000)
        selected = FFMPEGFull._select_converters(info)
        self.assertEqual(len(selected), 1)
        self.assertEqual(selected[0].bitrate, 24)
