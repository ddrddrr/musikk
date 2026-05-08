import json
import re
import subprocess
from dataclasses import dataclass
from pathlib import Path

from django.conf import settings
from rest_framework.exceptions import ValidationError
from utils.cmd import run_shell_command

from streaming.audio.exceptions import AudioProcessingPipelineError

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


def get_audio_loudness(path: str | Path) -> tuple[float | None, float | None]:
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
        lufs, true_peak_dbtp (or None if something is not defined, e.g. if loudness is -inf)

    Example FFmpeg output::

        [Parsed_ebur128_0 @ 0xb9ac08b40]

        t: 0.0999773 TARGET:-23 LUFS M:-120.7 S:-120.7 I: -70.0 LUFS LRA: 0.0 LU FTPK: -27.2 -27.2 dBFS TPK: -27.2 -27.2 dBFS
        ...
                (a lof of the same)
        ...
        t: 170.199977 TARGET:-23 LUFS M: -20.5 S: -20.4 I: -14.7 LUFS LRA: 6.4 LU FTPK: -4.2 -4.2 dBFS TPK: -1.1 -1.1 dBFS

        [Parsed_ebur128_0 @ 0xb9ac08b40]

        Summary: Integrated loudness: I: -14.7 LUFS Threshold: -24.8 LUFS Loudness range: LRA: 6.4 LU Threshold: -34.8 LUFS LRA low: -19.2 LUFS LRA high: -12.8 LUFS True peak: Peak: -1.1 dBFS
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

    return _parse_ebur128_lufs(stderr), _parse_ebur128_peak(stderr)


def _parse_ebur128_lufs(stderr: str) -> float | None:
    """
    Extract LUFS loudness from ebur128 summary.

    The raw output contains per-frame lines that also have ``I:`` values;
    we take the last match which is the summary value.
    Returns None for audio with LUFS==-inf.
    """
    matches = re.findall(r"I:\s+([-\d.]+|-inf)\s+LUFS", stderr)
    if not matches:
        raise AudioProcessingPipelineError(
            "Failed to parse integrated loudness from ebur128 output"
        )
    raw = matches[-1]
    if raw == "-inf":
        return None
    return float(raw)


def _parse_ebur128_peak(stderr: str) -> float | None:
    """
    Extract true peak from ebur128 summary.

    The summary ``Peak:`` line has one value per channel
    (e.g., ``Peak: -1.1 -2.3 dBFS`` for stereo).
    Returns the loudest (max) channel peak.
    Returns None when all channels are -inf.
    """
    match = re.search(r"Peak:\s+(.+?)\s*dBFS", stderr)
    if not match:
        raise AudioProcessingPipelineError(
            "Failed to parse true peak from ebur128 output"
        )
    tokens = match.group(1).split()
    values = [float(t) for t in tokens]
    peak = max(values)
    if peak == float("-inf"):
        return None
    return peak
