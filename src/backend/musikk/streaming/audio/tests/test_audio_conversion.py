import json
import shutil
import tempfile
from pathlib import Path

from django.conf import settings
from django.test import TestCase
from utils.cmd import run_shell_command

from streaming.audio.config import DEFAULT_LOSSY_BITRATE
from streaming.audio.ffmpeg_conf.converters import AACHEv2_CONVERTER
from streaming.audio.ffmpeg_conf.ffmpeg_wrapper import (
    FFMPEGFlacOnly,
    FFMPEGFull,
    FFMPEGWrapper,
)
from streaming.audio.normalization import build_normalization_filters
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
            for converted in results:
                self.assertTrue(
                    Path(converted.path).exists(),
                    f"Expected converted file to exist: {converted.path}",
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
            for converted in results:
                self.assertTrue(
                    Path(converted.path).exists(),
                    f"Expected converted file to exist: {converted.path}",
                )


def _probe_stream(path: str, entries: str) -> dict[str, str]:
    result = run_shell_command(
        [
            settings.FFPROBE_BIN,
            "-v",
            "error",
            "-select_streams",
            "a",
            "-show_entries",
            f"stream={entries}",
            "-of",
            "json",
            path,
        ]
    )
    return json.loads(result.stdout)["streams"][0]


def _aac_profile(path: str) -> str:
    return _probe_stream(path, "profile")["profile"]


class TestHighResolutionSource(TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        super().setUpClass()
        cls._tmp_dir = tempfile.mkdtemp()
        cls.source = Path(cls._tmp_dir) / "s24_96k.wav"
        run_shell_command(
            [
                settings.FFMPEG_BIN,
                "-v",
                "error",
                "-f",
                "lavfi",
                "-i",
                "sine=frequency=1000:sample_rate=96000:duration=1",
                "-ac",
                "2",
                "-c:a",
                "pcm_s24le",
                str(cls.source),
            ]
        )

    @classmethod
    def tearDownClass(cls) -> None:
        shutil.rmtree(cls._tmp_dir)
        super().tearDownClass()

    def test_flac_version_keeps_24_bits_after_resample(self):
        info = get_audio_metadata(self.source)
        with tempfile.TemporaryDirectory() as output_dir:
            results = FFMPEGFull.convert_audio(
                file_path=self.source,
                output_dir=output_dir,
                audio_info=info,
                filters=build_normalization_filters(info),
            )
            [flac] = [f for f in results if f.converter.lossless]
            stream = _probe_stream(flac.path, "sample_rate,bits_per_raw_sample")

        self.assertEqual(len(results), 5)
        self.assertEqual(stream, {"sample_rate": "48000", "bits_per_raw_sample": "24"})


class TestHEAACProfile(TestCase):
    formats_dir = Path(__file__).parent / "data" / "formats"
    wrapper = FFMPEGWrapper(audio_converters=[AACHEv2_CONVERTER])

    def _convert(self, source: Path, output_dir: str) -> str:
        info = get_audio_metadata(source)
        [output] = self.wrapper.convert_audio(
            file_path=source, output_dir=output_dir, audio_info=info
        )
        return output.path

    def test_stereo_source_is_encoded_as_he_aac_v2(self):
        with tempfile.TemporaryDirectory() as output_dir:
            output = self._convert(self.formats_dir / "sample.flac", output_dir)
            self.assertEqual(_aac_profile(output), "HE-AACv2")

    def test_mono_source_is_encoded_as_he_aac(self):
        with tempfile.TemporaryDirectory() as output_dir:
            output = self._convert(self.formats_dir / "mono.wav", output_dir)
            self.assertEqual(_aac_profile(output), "HE-AAC")


# TODO: add tests with lossy files (MP3/Opus)
class TestConverterSelection(TestCase):
    def test_stereo_source_keeps_he_aac_v2(self):
        selected = FFMPEGFull._select_converters(_make_info(channels=2))
        self.assertIn(AACHEv2_CONVERTER, selected)
        self.assertNotIn(AACHEv2_CONVERTER.mono_variant, selected)

    def test_mono_source_swaps_he_aac_v2_for_mono_variant(self):
        for codec_name in ("pcm_s16le", "aac"):
            with self.subTest(codec_name=codec_name):
                info = _make_info(channels=1, codec_name=codec_name, bit_rate=96_000)
                selected = FFMPEGFull._select_converters(info)
                self.assertIn(AACHEv2_CONVERTER.mono_variant, selected)
                self.assertNotIn(AACHEv2_CONVERTER, selected)

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

    def test_lossy_below_lowest_tier_keeps_lowest_tier(self):
        for channels, converter in (
            (2, AACHEv2_CONVERTER),
            (1, AACHEv2_CONVERTER.mono_variant),
        ):
            with self.subTest(channels=channels):
                info = _make_info(codec_name="aac", bit_rate=16_000, channels=channels)
                self.assertEqual(FFMPEGFull._select_converters(info), [converter])

    def test_lossy_very_low_bitrate_returns_lowest_tier_only(self):
        info = _make_info(codec_name="aac", bit_rate=24_000)
        selected = FFMPEGFull._select_converters(info)
        self.assertEqual(len(selected), 1)
        self.assertEqual(selected[0].bitrate, 24)
