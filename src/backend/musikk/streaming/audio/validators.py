import os
from io import BufferedReader
from pathlib import Path

import magic
from django.core.files.uploadedfile import InMemoryUploadedFile, TemporaryUploadedFile
from rest_framework.exceptions import ValidationError

from streaming.audio.config import MAX_FILE_SIZE, ALLOWED_FILE_TYPES


def validate_audio(song: bytes | str | Path | BufferedReader | InMemoryUploadedFile | TemporaryUploadedFile) -> None:
    if isinstance(song, bytes):
        size = len(song)
        header = song[:2048]  # First 2KB

    elif isinstance(song, (str, Path)):
        path = Path(song)
        size = path.stat().st_size
        with path.open('rb') as f:
            header = f.read(2048)

    elif hasattr(song, 'read'):
        if hasattr(song, 'size'):
            size = song.size
        else:
            song.seek(0, os.SEEK_END)
            size = song.tell()

        song.seek(0)
        header = song.read(2048)
        song.seek(0)

    else:
        raise ValidationError(f"Unsupported type of audio file - {type(song)}.")

    if size > MAX_FILE_SIZE:
        raise ValidationError(f"Audio too large ({size} bytes); limit is {MAX_FILE_SIZE}.")

    mime = magic.from_buffer(header, mime=True)
    if not mime.startswith("audio/"):
        raise ValidationError(f"Wrong mime type for audio file. Expected audio/*, got {mime}.")

    subtype = mime.split('/', 1)[1].lower()
    if subtype not in ALLOWED_FILE_TYPES:
        raise ValidationError(f"Unsupported audio format: {subtype}.")
