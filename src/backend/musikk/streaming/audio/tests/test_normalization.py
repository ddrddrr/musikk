from django.test import TestCase

from streaming.audio.normalization import (
    _compute_target_channels,
    _compute_target_sample_rate,
    build_normalization_filters,
)
from streaming.audio.probes import AudioStreamInfo


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


class TestComputeTargetSampleRate(TestCase):
    def test_44100_preserved(self):
        self.assertIsNone(_compute_target_sample_rate(44100))

    def test_88200_downsamples_to_44100(self):
        self.assertEqual(_compute_target_sample_rate(88200), 44100)

    def test_176400_downsamples_to_44100(self):
        self.assertEqual(_compute_target_sample_rate(176400), 44100)

    def test_352800_downsamples_to_44100(self):
        self.assertEqual(_compute_target_sample_rate(352800), 44100)

    def test_48000_preserved(self):
        self.assertIsNone(_compute_target_sample_rate(48000))

    def test_96000_downsamples_to_48000(self):
        self.assertEqual(_compute_target_sample_rate(96000), 48000)

    def test_192000_downsamples_to_48000(self):
        self.assertEqual(_compute_target_sample_rate(192000), 48000)

    def test_384000_downsamples_to_48000(self):
        self.assertEqual(_compute_target_sample_rate(384000), 48000)

    def test_below_44100_preserved(self):
        self.assertIsNone(_compute_target_sample_rate(22050))
        self.assertIsNone(_compute_target_sample_rate(8000))

    def test_nonstandard_high_rate_downsamples_to_44100(self):
        self.assertEqual(_compute_target_sample_rate(500000), 44100)


class TestComputeTargetChannels(TestCase):
    def test_mono_preserved(self):
        self.assertIsNone(_compute_target_channels(1))

    def test_stereo_preserved(self):
        self.assertIsNone(_compute_target_channels(2))

    def test_3_channels_downmixed(self):
        self.assertEqual(_compute_target_channels(3), 2)

    def test_5_1_surround_downmixed(self):
        self.assertEqual(_compute_target_channels(6), 2)

    def test_7_1_surround_downmixed(self):
        self.assertEqual(_compute_target_channels(8), 2)


class TestBuildNormalizationFilters(TestCase):
    def test_standard_stereo_44100_only_formats_bit_depth(self):
        filters = build_normalization_filters(_make_info())
        self.assertEqual(filters, ["aformat=sample_fmts=s16"])

    def test_high_sample_rate_adds_resample(self):
        filters = build_normalization_filters(_make_info(sample_rate=96000))
        self.assertIn("aresample=48000", filters)
        self.assertIn("aformat=sample_fmts=s16", filters)

    def test_multichannel_adds_downmix(self):
        filters = build_normalization_filters(_make_info(channels=6))
        self.assertIn("aresample=ocl=stereo", filters)

    def test_multichannel_and_high_rate(self):
        filters = build_normalization_filters(_make_info(channels=6, sample_rate=96000))
        self.assertIn("aresample=ocl=stereo", filters)
        self.assertIn("aresample=48000", filters)
        self.assertIn("aformat=sample_fmts=s16", filters)

    def test_downmix_before_resample(self):
        filters = build_normalization_filters(_make_info(channels=6, sample_rate=96000))
        downmix_idx = filters.index("aresample=ocl=stereo")
        resample_idx = filters.index("aresample=48000")
        self.assertLess(downmix_idx, resample_idx)

    def test_format_filter_always_last(self):
        filters = build_normalization_filters(_make_info(channels=6, sample_rate=96000))
        self.assertEqual(filters[-1], "aformat=sample_fmts=s16")

    def test_mono_low_rate_only_formats(self):
        filters = build_normalization_filters(_make_info(channels=1, sample_rate=22050))
        self.assertEqual(filters, ["aformat=sample_fmts=s16"])
