import os
from pathlib import Path
from django.core.files.base import File
from django.core.files.storage import default_storage

orig_path = transferred_path = str


def local_dir_to_storage(
    local_dir: str | Path, storage_prefix: str, overwrite: bool = False
) -> dict[orig_path, transferred_path]:
    """
    Takes a local directory path and stores its contents in storage under storage_prefix directory.

    If local FS backend is used, writes files under MEDIA_ROOT directory. The path must be a relative path
    to that directory. E.g. to write files under /media/audio/... specify `storage_prefix='audio'`.

    Returns:
        Mapping of format {`original path`: `storage path`}
    """
    paths: dict[str, str] = {}
    local_dir = Path(local_dir)
    for root, _, files in os.walk(local_dir):
        for fname in files:
            abs_path = Path(root) / fname
            # preserves directory structure for file under the root dir
            rel_path = abs_path.relative_to(local_dir).as_posix()
            key = f"{storage_prefix}/{rel_path}"

            # TODO: add err handling
            if overwrite and default_storage.exists(key):
                default_storage.delete(key)

            with open(abs_path, "rb") as f:
                paths[str(abs_path)] = default_storage.save(key, File(f))

    return paths


def delete_storage_dir(storage_dir: str | Path) -> None:
    """Deletes a dir from Django storage"""
    storage_dir = str(storage_dir)

    subdirs, files = default_storage.listdir(storage_dir)
    for fname in files:
        default_storage.delete(f"{storage_dir}/{fname}")
    for sub in subdirs:
        delete_storage_dir(f"{storage_dir}/{sub}")
