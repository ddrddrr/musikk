import os
from pathlib import Path
from typing import Protocol, runtime_checkable, TypeAlias

import magic
from rest_framework.exceptions import ValidationError

from streaming.audio.config import (
    ALLOWED_FILE_TYPES,
    MAX_CHANNELS,
    MAX_DURATION_SECONDS,
    MAX_FILE_SIZE,
    MAX_SAMPLE_RATE,
    is_codec_allowed,
)
from streaming.audio.probes import AudioStreamInfo, get_audio_metadata


# admin/testing
BytesLike: TypeAlias = bytes | bytearray | memoryview
Pathish: TypeAlias = str | os.PathLike[str]


# django's UploadedFile exposes those but doesn't declare
# a base type that could be used for type checking...
@runtime_checkable
class SeekableReader(Protocol):
    def read(self, n: int = ...) -> bytes: ...
    def seek(self, offset: int, whence: int = ...) -> int: ...
    def tell(self) -> int: ...


AudioInput: TypeAlias = BytesLike | Pathish | SeekableReader


def _validate_size_type(song: AudioInput) -> None:
    """
    Validate size and type
    """
    header: bytes
    size: int

    if isinstance(song, (bytes, bytearray, memoryview)):
        data = bytes(song)
        size = len(data)
        header = data[:2048]

    elif isinstance(song, (str, os.PathLike)):
        path = Path(song)
        size = path.stat().st_size
        with path.open("rb") as f:
            header = f.read(2048)

    elif isinstance(song, SeekableReader):
        if not (size := getattr(song, "size", None)):
            song.seek(0, os.SEEK_END)
            size = song.tell()
        song.seek(0)
        header = song.read(2048)
        song.seek(0)

    else:
        assert False, f"Unsupported type of audio file - {type(song)}."

    if not size:
        raise ValidationError(f"Could not determine the size of the audio file.")

    if size > MAX_FILE_SIZE:
        raise ValidationError(
            f"Audio too large ({size} bytes); limit is {MAX_FILE_SIZE}."
        )

    try:
        mime = magic.from_buffer(header or b"", mime=True) or ""
    except Exception:
        raise ValidationError("Could not detect audio type.")

    if not mime.startswith("audio/"):
        raise ValidationError(
            f"Wrong mime type for audio file. Expected audio/*, got {mime}."
        )

    subtype = mime.split("/", 1)[1].lower()
    if subtype not in ALLOWED_FILE_TYPES:
        raise ValidationError(f"Unsupported audio format: {subtype}.")


def _validate_audio_properties(info: AudioStreamInfo) -> None:
    """
    Validate duration, sample rate, channels, codec
    """
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
    _validate_size_type(path)
    info = get_audio_metadata(path)
    _validate_audio_properties(info)
    return info
