import logging
import os
from collections.abc import Iterator
from pathlib import Path

from django.core.files.base import File
from django.core.files.storage import default_storage

logger = logging.getLogger(__name__)

type orig_path = str
type transferred_path = str


def local_dir_to_django_storage(
    local_dir: str | Path, storage_prefix: str, overwrite: bool = False
) -> dict[orig_path, transferred_path]:
    """
    Take a local directory path and store its contents in Django storage under storage_prefix directory.

    For local FS:
     writes files under `MEDIA_ROOT` directory
     (the path must be a relative path to that directory).
     E.g., to write files under /media/audio/... specify `storage_prefix='audio'`.

    Returns:
        Mapping of format {`original path`: `storage path`}
    """
    paths: dict[str, str] = {}
    local_dir = Path(local_dir)

    for root, _, files in os.walk(local_dir):
        for fname in files:
            abs_path = Path(root) / fname
            rel_path = abs_path.relative_to(local_dir).as_posix()
            key = f"{storage_prefix}/{rel_path}"

            if overwrite and default_storage.exists(key):
                default_storage.delete(key)

            with open(abs_path, "rb") as f:
                paths[str(abs_path)] = default_storage.save(key, File(f))

    return paths


def delete_django_storage_dir(storage_dir: str | Path) -> None:
    """
    Logs a failure instead of raising it. Most callers run this while they handle
    another error, and an exception here would hide that error.
    """
    storage_dir = str(storage_dir)
    try:
        _delete_storage_tree(storage_dir)
    except Exception:
        logger.exception(f"Failed to delete storage directory {storage_dir}")


def _delete_storage_tree(storage_dir: str) -> None:
    if not default_storage.exists(storage_dir):
        return
    subdirs, files = default_storage.listdir(storage_dir)
    for file_name in files:
        default_storage.delete(f"{storage_dir}/{file_name}")
    for subdir in subdirs:
        _delete_storage_tree(f"{storage_dir}/{subdir}")
    default_storage.delete(storage_dir)


def walk_django_storage_files(storage_dir: str) -> Iterator[str]:
    if not default_storage.exists(storage_dir):
        return
    subdirs, files = default_storage.listdir(storage_dir)
    for file_name in files:
        yield f"{storage_dir}/{file_name}"
    for subdir in subdirs:
        yield from walk_django_storage_files(f"{storage_dir}/{subdir}")
