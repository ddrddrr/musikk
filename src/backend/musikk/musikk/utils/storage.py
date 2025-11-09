import os
from pathlib import Path
from django.core.files.base import File
from django.core.files.storage import default_storage

type orig_path = str
type transferred_path = str


def local_dir_to_django_storage(
    local_dir: str | Path, storage_prefix: str, overwrite: bool = False
) -> dict[orig_path, transferred_path]:
    """
    Take a local directory path and store its contents in Django storage under storage_prefix directory.

    For local FS:
     writes files under `MEDIA_ROOT` directory
     hence, the path must be a relative path to that directory.
     E.g. to write files under /media/audio/... specify `storage_prefix='audio'`.

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


# TODO: add proper err handling
def delete_django_storage_dir(storage_dir: str | Path) -> None:
    """Delete a dir from Django storage"""
    storage_dir = str(storage_dir)

    subdirs, files = default_storage.listdir(storage_dir)
    for fname in files:
        default_storage.delete(f"{storage_dir}/{fname}")
    for sub in subdirs:
        delete_django_storage_dir(f"{storage_dir}/{sub}")

    default_storage.delete(storage_dir)


def get_django_storage_files(storage_file_paths: list[str], tmpdir: str) -> list[Path]:
    """Download files from Django storage to tmpdir and return their local paths."""
    local_paths: list[Path] = []
    for idx, file_path in enumerate(storage_file_paths):
        fname = Path(file_path).name
        local_fname = f"{idx:02d}_{fname}"
        local_path = Path(tmpdir) / local_fname

        with (
            default_storage.open(file_path, "rb") as src,
            open(local_path, "wb") as dst,
        ):
            # stream copy to avoid large memory usage
            for chunk in src.chunks():
                dst.write(chunk)

        local_paths.append(local_path)

    return local_paths
