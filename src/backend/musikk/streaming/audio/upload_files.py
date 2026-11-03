"""
Local files of album uploads. These paths are on the upload volume, not in
Django storage, so they go through `pathlib` and `shutil` only. Passing one
of them to `default_storage` raises `SuspiciousFileOperation`.

Layout under `UPLOAD_TMP_DIR`:
    incoming/                   Django's request upload files (FILE_UPLOAD_TEMP_DIR)
    songs/<song_uuid>/source*   the uploaded file of one track
    songs/<song_uuid>/work/     intermediate files of the processing pipeline
"""

import os
import shutil
from pathlib import Path
from uuid import UUID

from django.conf import settings

SOURCE_FILE_STEM = "source"
MAX_SUFFIX_LENGTH = 8


def incoming_dir() -> Path:
    return Path(settings.FILE_UPLOAD_TEMP_DIR)


def songs_dir() -> Path:
    return Path(settings.UPLOAD_TMP_DIR) / "songs"


def track_dir(song_uuid: str | UUID) -> Path:
    return songs_dir() / str(song_uuid)


def track_work_dir(song_uuid: str | UUID) -> Path:
    return track_dir(song_uuid) / "work"


def create_upload_dirs() -> None:
    """
    Django writes to FILE_UPLOAD_TEMP_DIR while it parses the request body,
    before any view runs, and it does not create the folder itself. A
    missing folder would turn every upload into a 500.
    """
    incoming_dir().mkdir(parents=True, exist_ok=True)
    songs_dir().mkdir(parents=True, exist_ok=True)


def _source_suffix(filename: str) -> str:
    """
    Keeps the extension, because FFmpeg uses it as a hint when it probes raw
    formats such as ADTS AAC. Anything that does not look like a plain
    extension is dropped.
    """
    suffix = Path(filename).suffix.lower()
    if len(suffix) <= MAX_SUFFIX_LENGTH and suffix[1:].isalnum():
        return suffix
    return ""


def move_upload_to_track_dir(
    upload_path: str | Path, song_uuid: str | UUID, filename: str
) -> Path:
    """
    Moves the file instead of copying it, so a 2 GB upload is not written a
    second time. `os.replace` works only inside one filesystem, which is why
    FILE_UPLOAD_TEMP_DIR is on the upload volume too.
    """
    folder = track_dir(song_uuid)
    folder.mkdir(parents=True)
    source = folder / f"{SOURCE_FILE_STEM}{_source_suffix(filename)}"
    os.replace(upload_path, source)
    return source


def find_source_file(song_uuid: str | UUID) -> Path | None:
    return next(track_dir(song_uuid).glob(f"{SOURCE_FILE_STEM}*"), None)


def delete_track_dir(song_uuid: str | UUID) -> None:
    shutil.rmtree(track_dir(song_uuid), ignore_errors=True)
