import json
import tempfile
from pathlib import Path
from unittest.mock import MagicMock, patch

from django.test import TestCase
from rest_framework.exceptions import ValidationError

from streaming.audio.config import (
    MAX_CHANNELS,
    MAX_DURATION_SECONDS,
    MAX_FILE_SIZE,
    MAX_SAMPLE_RATE,
)
from streaming.audio.probes import (
    AudioStreamInfo,
    get_audio_loudness,
    get_audio_metadata,
)
from streaming.audio.validators import _validate_audio_properties, _validate_size_type


def _ffprobe_output(
    codec_name="pcm_s16le",
    sample_rate="44100",
    channels=2,
    bit_depth="16",
    stream_duration="180.0",
    format_duration="180.0",
    include_stream=True,
):
    streams = []
    if include_stream:
        stream = {
            "codec_name": codec_name,
            "sample_rate": sample_rate,
            "channels": channels,
        }
        if bit_depth is not None:
            stream["bits_per_raw_sample"] = bit_depth
        if stream_duration is not None:
            stream["duration"] = stream_duration
        streams.append(stream)

    data = {"streams": streams, "format": {}}
    if format_duration is not None:
        data["format"]["duration"] = format_duration
    return json.dumps(data)


def _mock_result(stdout: str) -> MagicMock:
    result = MagicMock()
    result.stdout = stdout
    return result


class ProbeAudioTests(TestCase):
    @patch("streaming.audio.probes.run_shell_command")
    def test_valid_output(self, mock_cmd):
        mock_cmd.return_value = _mock_result(_ffprobe_output())

        info = get_audio_metadata("/fake/path.wav")

        self.assertEqual(info.duration_seconds, 180.0)
        self.assertEqual(info.sample_rate, 44100)
        self.assertEqual(info.channels, 2)
        self.assertEqual(info.codec_name, "pcm_s16le")
        self.assertEqual(info.bit_depth, 16)

    @patch("streaming.audio.probes.run_shell_command")
    def test_no_audio_stream_raises(self, mock_cmd):
        mock_cmd.return_value = _mock_result(_ffprobe_output(include_stream=False))

        with self.assertRaises(ValidationError) as ctx:
            get_audio_metadata("/fake/path.wav")
        self.assertIn("No audio stream", str(ctx.exception.detail))

    @patch("streaming.audio.probes.run_shell_command")
    def test_multiple_audio_streams_raises(self, mock_cmd):
        two_streams = json.loads(_ffprobe_output())
        two_streams["streams"].append(two_streams["streams"][0])
        mock_cmd.return_value = _mock_result(json.dumps(two_streams))

        with self.assertRaises(ValidationError) as ctx:
            get_audio_metadata("/fake/path.wav")
        self.assertIn("2 audio streams", str(ctx.exception.detail))

    @patch("streaming.audio.probes.run_shell_command")
    def test_fallback_to_format_duration(self, mock_cmd):
        mock_cmd.return_value = _mock_result(
            _ffprobe_output(stream_duration=None, format_duration="240.5")
        )

        info = get_audio_metadata("/fake/path.wav")
        self.assertAlmostEqual(info.duration_seconds, 240.5)

    @patch("streaming.audio.probes.run_shell_command")
    def test_no_bit_depth(self, mock_cmd):
        mock_cmd.return_value = _mock_result(_ffprobe_output(bit_depth=None))

        info = get_audio_metadata("/fake/path.wav")
        self.assertIsNone(info.bit_depth)


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


class ValidateAudioPropertiesTests(TestCase):
    def test_valid_properties_passes(self):
        _validate_audio_properties(_make_info())

    def test_duration_exceeds_limit(self):
        info = _make_info(duration_seconds=MAX_DURATION_SECONDS + 1)
        with self.assertRaises(ValidationError) as ctx:
            _validate_audio_properties(info)
        self.assertIn("too long", str(ctx.exception.detail))

    def test_sample_rate_zero(self):
        info = _make_info(sample_rate=0)
        with self.assertRaises(ValidationError) as ctx:
            _validate_audio_properties(info)
        self.assertIn("sample rate", str(ctx.exception.detail).lower())

    def test_sample_rate_too_high(self):
        info = _make_info(sample_rate=MAX_SAMPLE_RATE + 1)
        with self.assertRaises(ValidationError) as ctx:
            _validate_audio_properties(info)
        self.assertIn("sample rate", str(ctx.exception.detail).lower())

    def test_sample_rate_at_boundaries_passes(self):
        _validate_audio_properties(_make_info(sample_rate=1))
        _validate_audio_properties(_make_info(sample_rate=MAX_SAMPLE_RATE))

    def test_zero_channels(self):
        info = _make_info(channels=0)
        with self.assertRaises(ValidationError) as ctx:
            _validate_audio_properties(info)
        self.assertIn("channel", str(ctx.exception.detail).lower())

    def test_too_many_channels(self):
        info = _make_info(channels=MAX_CHANNELS + 1)
        with self.assertRaises(ValidationError) as ctx:
            _validate_audio_properties(info)
        self.assertIn("channel", str(ctx.exception.detail).lower())

    def test_channels_at_boundary_passes(self):
        _validate_audio_properties(_make_info(channels=1))
        _validate_audio_properties(_make_info(channels=MAX_CHANNELS))

    def test_unknown_codec(self):
        info = _make_info(codec_name="wma")
        with self.assertRaises(ValidationError) as ctx:
            _validate_audio_properties(info)
        self.assertIn("codec", str(ctx.exception.detail).lower())

    def test_all_allowed_codecs_pass(self):
        from streaming.audio.config import ALLOWED_CODECS

        for codec in ALLOWED_CODECS:
            _validate_audio_properties(_make_info(codec_name=codec))

    def test_pcm_codecs_pass(self):
        for codec in ("pcm_s16le", "pcm_s24be", "pcm_f32le"):
            _validate_audio_properties(_make_info(codec_name=codec))


class ValidateSizeTypeTests(TestCase):
    @patch("streaming.audio.validators.magic.from_buffer", return_value="audio/wav")
    def test_valid_bytes(self, _mock_magic):
        data = b"\x00" * 1024
        _validate_size_type(data)

    @patch("streaming.audio.validators.magic.from_buffer", return_value="audio/wav")
    def test_valid_path(self, _mock_magic):
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
            f.write(b"\x00" * 1024)
            f.flush()
            _validate_size_type(Path(f.name))

    def test_empty_bytes_raises(self):
        with self.assertRaises(ValidationError) as ctx:
            _validate_size_type(b"")
        self.assertIn("size", str(ctx.exception.detail).lower())

    @patch("streaming.audio.validators.magic.from_buffer", return_value="audio/wav")
    def test_oversized_bytes_raises(self, _mock_magic):
        with self.assertRaises(ValidationError) as ctx:
            _validate_size_type(b"\x00" * (MAX_FILE_SIZE + 1))
        self.assertIn("too large", str(ctx.exception.detail).lower())

    @patch("streaming.audio.validators.magic.from_buffer", return_value="video/mp4")
    def test_non_audio_mime_raises(self, _mock_magic):
        with self.assertRaises(ValidationError) as ctx:
            _validate_size_type(b"\x00" * 1024)
        self.assertIn("wrong mime", str(ctx.exception.detail).lower())

    @patch(
        "streaming.audio.validators.magic.from_buffer", return_value="audio/x-ms-wma"
    )
    def test_unsupported_audio_subtype_raises(self, _mock_magic):
        with self.assertRaises(ValidationError) as ctx:
            _validate_size_type(b"\x00" * 1024)
        self.assertIn("unsupported audio format", str(ctx.exception.detail).lower())

    @patch("streaming.audio.validators.magic.from_buffer", return_value="audio/flac")
    def test_allowed_subtypes_pass(self, _mock_magic):
        data = b"\x00" * 1024
        for subtype in ("wav", "flac", "mpeg", "ogg", "opus", "aac", "mp4"):
            _mock_magic.return_value = f"audio/{subtype}"
            _validate_size_type(data)


def _ebur128_stderr(lufs="-14.7", peaks="-1.1 -1.1"):
    return (
        f"[Parsed_ebur128_0 @ 0x1234]\n"
        f"Summary:\n"
        f"  Integrated loudness:\n"
        f"    I:         {lufs} LUFS\n"
        f"    Threshold: -24.8 LUFS\n"
        f"  True peak:\n"
        f"    Peak:      {peaks} dBFS\n"
    )


class LoudnessMeasurementTests(TestCase):
    @patch("streaming.audio.probes.run_shell_command")
    def test_stereo(self, mock_cmd):
        mock_cmd.return_value = MagicMock(stderr=_ebur128_stderr())
        lufs, peak = get_audio_loudness("/fake/path.wav")
        self.assertAlmostEqual(lufs, -14.7)
        self.assertAlmostEqual(peak, -1.1)

    @patch("streaming.audio.probes.run_shell_command")
    def test_multichannel_returns_loudest_peak(self, mock_cmd):
        mock_cmd.return_value = MagicMock(
            stderr=_ebur128_stderr(peaks="-1.1 -2.3 -1.5 -2.1 -3.0 -1.8")
        )
        lufs, peak = get_audio_loudness("/fake/path.wav")
        self.assertAlmostEqual(lufs, -14.7)
        self.assertAlmostEqual(peak, -1.1)

    @patch("streaming.audio.probes.run_shell_command")
    def test_mono(self, mock_cmd):
        mock_cmd.return_value = MagicMock(
            stderr=_ebur128_stderr(lufs="-20.0", peaks="-3.2")
        )
        lufs, peak = get_audio_loudness("/fake/path.wav")
        self.assertAlmostEqual(lufs, -20.0)
        self.assertAlmostEqual(peak, -3.2)

    @patch("streaming.audio.probes.run_shell_command")
    def test_silent_audio_returns_none(self, mock_cmd):
        mock_cmd.return_value = MagicMock(
            stderr=_ebur128_stderr(lufs="-inf", peaks="-inf")
        )
        lufs, peak = get_audio_loudness("/fake/path.wav")
        self.assertIsNone(lufs)
        self.assertIsNone(peak)
