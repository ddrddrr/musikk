import os
from pathlib import Path
from typing import Protocol, runtime_checkable, TypeAlias

import magic
from rest_framework.exceptions import ValidationError

from streaming.audio.config import MAX_FILE_SIZE, ALLOWED_FILE_TYPES


BytesLike: TypeAlias = bytes | bytearray | memoryview
Pathish: TypeAlias = str | os.PathLike[str]


@runtime_checkable
class SeekableReader(Protocol):
    def read(self, n: int = ...) -> bytes: ...
    def seek(self, offset: int, whence: int = ...) -> int: ...
    def tell(self) -> int: ...


AudioInput: TypeAlias = BytesLike | Pathish | SeekableReader

# TODO: run ffprobe and reject extreme sample rates, huge channel counts, etc.


def validate_audio(song: AudioInput) -> None:
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
