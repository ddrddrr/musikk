import json
import re
import subprocess
from dataclasses import dataclass
from pathlib import Path

from django.conf import settings
from rest_framework.exceptions import ValidationError

from streaming.audio.exceptions import AudioProcessingPipelineError
from utils.cmd import run_shell_command

# TODO: check if enough
FFPROBE_TIMEOUT = 30  # sec
LOUDNESS_CHECK_TIMEOUT = 120  # sec


@dataclass
class AudioStreamInfo:
    duration_seconds: float
    sample_rate: int
    channels: int
    codec_name: str
    bit_depth: int | None
    bit_rate: int | None  # in bits per s (not kbits!)


def get_audio_metadata(path: str | Path) -> AudioStreamInfo:
    """
    Run FFprobe on the file at *path* and return parsed audio stream metadata.

    FFprobe flags:
         - `-v error`
            suppress info/warning noise, only show errors
         - `-select_streams a`
            select only audio streams (ignore video/subtitle/data)
         - `-show_entries stream=...`
            restrict the output to specific fields (by default FFprobe outputs a ton of different info fields)
         - `-show_entries format=...`
            fallback for duration and bit_rate (some containers like WAV only report it at the format level)
         - `-of json`
            output as json
         - `*path*
            the path to the file to analyze

    Example FFmpeg output::

        {
            "programs": [],
            "stream_groups": [],
            "streams": [
                {
                    "codec_name": "mp3",
                    "sample_rate": "44100",
                    "channels": 2,
                    "duration": "170.240000",
                    "bit_rate": "192000",
                    "side_data_list": [{}]
                }
            ],
            "format": {
                "duration": "170.240000",
                "bit_rate": "192060"
            }
        }
    """
    cmd = [
        settings.FFPROBE_BIN,
        "-v",
        "error",
        "-select_streams",
        "a",
        "-show_entries",
        "stream=codec_name,sample_rate,channels,bits_per_raw_sample,duration,bit_rate",
        "-show_entries",
        "format=duration,bit_rate",
        "-of",
        "json",
        str(path),
    ]

    try:
        result = run_shell_command(cmd, timeout=FFPROBE_TIMEOUT)
    except (subprocess.CalledProcessError, subprocess.TimeoutExpired):
        raise ValidationError("File is malformed or unreadable.")

    data = json.loads(result.stdout)
    streams = data.get("streams", [])
    if not streams:
        raise ValidationError("No audio stream found in file.")

    # no practical reason for an audio file to have multiple streams
    # there can be multiple channels tho
    if len(streams) > 1:
        raise ValidationError(
            f"File contains {len(streams)} audio streams, expected exactly one."
        )

    stream = streams[0]
    raw_duration = stream.get("duration") or data.get("format", {}).get("duration")
    bit_depth = stream.get("bits_per_raw_sample")
    raw_bit_rate = stream.get("bit_rate") or data.get("format", {}).get("bit_rate")
    return AudioStreamInfo(
        duration_seconds=float(raw_duration) if raw_duration else 0.0,
        sample_rate=int(stream["sample_rate"]),
        channels=int(stream["channels"]),
        codec_name=stream.get("codec_name", ""),
        bit_depth=int(bit_depth) if bit_depth else None,
        bit_rate=int(raw_bit_rate) if raw_bit_rate else None,
    )


def get_audio_loudness(path: str | Path) -> tuple[float, float]:
    """
    Measure audio loudness (LUFS, ITU-R BS.1770) and true peak (dBTP)
    using FFmpeg's ebur128 filter.
    See https://ffmpeg.org/ffmpeg-filters.html#toc-ebur128-1 for more details.

    FFmpeg flags:
        - `-i`
           input file
        - `-filter:a ebur128=peak=true`
           apply the EBU R128 (loudness) filter + true peak measurement
        - `-f null -`
          don't write output to a file (write to stderr instead)

    Returns:
         lufs, true_peak_dbtp

    Example FFmpeg output::

        [Parsed_ebur128_0 @ 0xb9ac08b40]

        t: 0.0999773 TARGET:-23 LUFS M:-120.7 S:-120.7 I: -70.0 LUFS LRA: 0.0 LU FTPK: -27.2 -27.2 dBFS TPK: -27.2 -27.2 dBFS Output #0, null, to 'pipe:': Metadata: encoder : Lavf62.6.101 Stream #0:0: Audio: pcm_s16le, 44100 Hz, stereo, s16, 1411 kb/s Metadata: encoder : Lavc62.19.100 pcm_s16le Side data: Replay Gain: track gain - -3.400000, track peak - 0.000021, album gain - -5.800000, album peak - unknown,

        [Parsed_ebur128_0 @ 0xb9ac08b40]

        t: 0.199977 TARGET:-23 LUFS M:-120.7 S:-120.7 I: -70.0 LUFS LRA: 0.0 LU FTPK: -5.9 -5.9 dBFS TPK: -5.9 -5.9 dBFS
        ...
        (a lof of the same)
        ...
        [Parsed_ebur128_0 @ 0xb9ac08b40]

        t: 170.199977 TARGET:-23 LUFS M: -20.5 S: -20.4 I: -14.7 LUFS LRA: 6.4 LU FTPK: -4.2 -4.2 dBFS TPK: -1.1 -1.1 dBFS

        [Parsed_ebur128_0 @ 0xb9ac08b40]

        Summary: Integrated loudness: I: -14.7 LUFS Threshold: -24.8 LUFS Loudness range: LRA: 6.4 LU Threshold: -34.8 LUFS LRA low: -19.2 LUFS LRA high: -12.8 LUFS True peak: Peak: -1.1 dBFS

        [out#0/null @ 0xb9ac086c0]

        video:0KiB audio:29326KiB subtitle:0KiB other streams:0KiB global headers:0KiB muxing overhead: unknown size=N/A time=00:02:50.24 bitrate=N/A speed= 172x elapsed=0:00:00.99
    """
    cmd = [
        settings.FFMPEG_BIN,
        "-i",
        str(path),
        "-filter:a",
        "ebur128=peak=true",
        "-f",
        "null",
        "-",
    ]
    try:
        result = run_shell_command(cmd, timeout=LOUDNESS_CHECK_TIMEOUT)
    except (subprocess.CalledProcessError, subprocess.TimeoutExpired) as exc:
        raise AudioProcessingPipelineError(
            f"FFmpeg ebur128 measurement failed for {path}"
        ) from exc
    stderr = result.stderr

    return (
        _parse_ebur128_value(stderr, r"I:\s+([-\d.]+)\s+LUFS"),
        _parse_ebur128_value(stderr, r"Peak:\s+([-\d.]+)\s+dBFS"),
    )


def _parse_ebur128_value(stderr: str, pattern: str) -> float:
    """
    Extract a value from ebur128 stderr output using a regex.

    The raw ouput contains a lot of redundant per-frame lines in the format of:
        ... I: -14.7 LUFS ... FTPK: -3.8 -3.8 dBFS  TPK: -1.1 -1.1 dBFS

    We need the summary block instead (at the end), which looks like:
        Integrated loudness:
          I:         -14.7 LUFS
        True peak:
          Peak:       -1.1 dBFS

    For `I` we take the last match (the summary value), peak appears only in the summary.
    """
    matches = re.findall(pattern, stderr)
    if not matches:
        raise AudioProcessingPipelineError(
            f"Failed to parse ebur128 output for pattern: {pattern}"
        )
    return float(matches[-1])
