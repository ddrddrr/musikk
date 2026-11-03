import os
from pathlib import Path
from typing import TypeAlias

from rest_framework.exceptions import ValidationError

from streaming.audio.config import (
    MAX_CHANNELS,
    MAX_DURATION_SECONDS,
    MAX_FILE_SIZE,
    MAX_SAMPLE_RATE,
    is_codec_allowed,
)
from streaming.audio.probes import AudioStreamInfo, get_audio_metadata

Pathish: TypeAlias = str | os.PathLike[str]


def _validate_size(path: Pathish) -> None:
    size = Path(path).stat().st_size

    if not size:
        raise ValidationError("Could not determine the size of the audio file.")

    if size > MAX_FILE_SIZE:
        raise ValidationError(
            f"Audio too large ({size} bytes); limit is {MAX_FILE_SIZE}."
        )


def _validate_audio_properties(info: AudioStreamInfo) -> None:
    if info.duration_seconds <= 0:
        raise ValidationError("Could not determine the duration of the audio file.")

    if info.duration_seconds > MAX_DURATION_SECONDS:
        raise ValidationError(
            f"Audio is too long ({info.duration_seconds:.0f}s), "
            f"maximum allowed is {MAX_DURATION_SECONDS}s."
        )

    if info.sample_rate < 1 or info.sample_rate > MAX_SAMPLE_RATE:
        raise ValidationError(
            f"Unsupported sample rate: {info.sample_rate} Hz. "
            f"Must be between 1 and {MAX_SAMPLE_RATE} Hz."
        )

    if info.channels < 1 or info.channels > MAX_CHANNELS:
        raise ValidationError(
            f"Unsupported channel count: {info.channels}. "
            f"Must be between 1 and {MAX_CHANNELS}."
        )

    if not is_codec_allowed(info.codec_name):
        raise ValidationError(f"Unsupported audio codec: {info.codec_name}.")


def validate_audio(path: Pathish) -> AudioStreamInfo:
    _validate_size(path)
    info = get_audio_metadata(path)
    _validate_audio_properties(info)
    return info
