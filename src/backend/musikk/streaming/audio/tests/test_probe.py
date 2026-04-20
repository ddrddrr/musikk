import json
import subprocess
from unittest.mock import MagicMock, patch

from django.test import TestCase
from rest_framework.exceptions import ValidationError

from streaming.audio.config import (
    MAX_CHANNELS,
    MAX_DURATION_SECONDS,
    MAX_SAMPLE_RATE,
)
from streaming.audio.probes import AudioStreamInfo, get_audio_metadata
from streaming.audio.validators import _validate_audio_properties


def _ffprobe_output(
    *,
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
    def test_malformed_file_raises(self, mock_cmd):
        mock_cmd.side_effect = subprocess.CalledProcessError(1, "ffprobe")

        with self.assertRaises(ValidationError) as ctx:
            get_audio_metadata("/fake/path.wav")
        self.assertIn("malformed", str(ctx.exception.detail))

    @patch("streaming.audio.probes.run_shell_command")
    def test_timeout_raises(self, mock_cmd):
        mock_cmd.side_effect = subprocess.TimeoutExpired("ffprobe", 30)

        with self.assertRaises(ValidationError) as ctx:
            get_audio_metadata("/fake/path.wav")
        self.assertIn("malformed", str(ctx.exception.detail))

    @patch("streaming.audio.probes.run_shell_command")
    def test_no_audio_stream_raises(self, mock_cmd):
        mock_cmd.return_value = _mock_result(
            _ffprobe_output(include_stream=False)
        )

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
        mock_cmd.return_value = _mock_result(
            _ffprobe_output(bit_depth=None)
        )

        info = get_audio_metadata("/fake/path.wav")
        self.assertIsNone(info.bit_depth)


class ValidateAudioPropertiesTests(TestCase):
    def _make_info(self, **overrides) -> AudioStreamInfo:
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

    def test_valid_properties_passes(self):
        _validate_audio_properties(self._make_info())

    def test_duration_exceeds_limit(self):
        info = self._make_info(duration_seconds=MAX_DURATION_SECONDS + 1)
        with self.assertRaises(ValidationError) as ctx:
            _validate_audio_properties(info)
        self.assertIn("too long", str(ctx.exception.detail))

    def test_sample_rate_zero(self):
        info = self._make_info(sample_rate=0)
        with self.assertRaises(ValidationError) as ctx:
            _validate_audio_properties(info)
        self.assertIn("sample rate", str(ctx.exception.detail).lower())

    def test_sample_rate_too_high(self):
        info = self._make_info(sample_rate=MAX_SAMPLE_RATE + 1)
        with self.assertRaises(ValidationError) as ctx:
            _validate_audio_properties(info)
        self.assertIn("sample rate", str(ctx.exception.detail).lower())

    def test_sample_rate_at_boundaries_passes(self):
        _validate_audio_properties(self._make_info(sample_rate=1))
        _validate_audio_properties(self._make_info(sample_rate=MAX_SAMPLE_RATE))

    def test_zero_channels(self):
        info = self._make_info(channels=0)
        with self.assertRaises(ValidationError) as ctx:
            _validate_audio_properties(info)
        self.assertIn("channel", str(ctx.exception.detail).lower())

    def test_too_many_channels(self):
        info = self._make_info(channels=MAX_CHANNELS + 1)
        with self.assertRaises(ValidationError) as ctx:
            _validate_audio_properties(info)
        self.assertIn("channel", str(ctx.exception.detail).lower())

    def test_channels_at_boundary_passes(self):
        _validate_audio_properties(self._make_info(channels=1))
        _validate_audio_properties(self._make_info(channels=MAX_CHANNELS))

    def test_unknown_codec(self):
        info = self._make_info(codec_name="wma")
        with self.assertRaises(ValidationError) as ctx:
            _validate_audio_properties(info)
        self.assertIn("codec", str(ctx.exception.detail).lower())

    def test_all_allowed_codecs_pass(self):
        from streaming.audio.config import ALLOWED_CODECS

        for codec in ALLOWED_CODECS:
            _validate_audio_properties(self._make_info(codec_name=codec))

    def test_pcm_codecs_pass(self):
        for codec in ("pcm_s16le", "pcm_s24be", "pcm_f32le"):
            _validate_audio_properties(self._make_info(codec_name=codec))
