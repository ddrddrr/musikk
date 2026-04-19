import json
import subprocess
from dataclasses import dataclass
from pathlib import Path

from django.conf import settings
from rest_framework.exceptions import ValidationError

from utils.cmd import run_shell_command

FFPROBE_TIMEOUT = 30  # sec


@dataclass
class AudioStreamInfo:
    duration_seconds: float
    sample_rate: int
    channels: int
    codec_name: str
    bit_depth: int | None


def probe_audio(path: str | Path) -> AudioStreamInfo:
    """
    Run ffprobe on the file at *path* and return parsed audio stream metadata.

    ffprobe flags:
         - `v error`
            suppress info/warning noise, only show errors
         - `select_streams a`
            select only audio streams (ignore video/subtitle/data)
         - `show_entries stream=...`
            restrict the output to specific fields (by default ffprobe outputs a ton of different info fields)
         - `show_entries format=duration`
            fallback field for duration (some containers like WAV only report it at the format level)
         - `of json`
            output as json
    """
    cmd = [
        settings.FFPROBE_BIN,
        "-v",
        "error",
        "-select_streams",
        "a",
        "-show_entries",
        "stream=codec_name,sample_rate,channels,bits_per_raw_sample,duration",
        "-show_entries",
        "format=duration",
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
    # TODO: also validate against max?
    bit_depth = stream.get("bits_per_raw_sample")
    return AudioStreamInfo(
        duration_seconds=float(raw_duration) if raw_duration else 0.0,
        sample_rate=int(stream["sample_rate"]),
        channels=int(stream["channels"]),
        codec_name=stream.get("codec_name", ""),
        bit_depth=int(bit_depth) if bit_depth else None,
    )
