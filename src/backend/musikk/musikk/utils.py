import os
import shutil
from pathlib import Path

from django.conf import settings


def image_path(instance, filename):
    image_dir = Path(settings.MEDIA_ROOT) / "images" / instance.__class__.__name__
    image_dir.mkdir(parents=True, exist_ok=True)

    return os.path.join("images", instance.__class__.__name__, str(instance.uuid))


def delete_dir_for_file(file: str | Path):
    # TODO: add logging here
    dir_path = Path(file).parent
    if dir_path.exists() and dir_path.is_dir():
        shutil.rmtree(dir_path)
