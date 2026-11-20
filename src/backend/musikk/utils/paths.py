import os
from pathlib import Path

from django.conf import settings

IMAGES_DIR = "images"


def deafult_image_path(instance, filename):
    image_dir = Path(settings.MEDIA_ROOT) / IMAGES_DIR / instance.__class__.__name__
    image_dir.mkdir(parents=True, exist_ok=True)

    return os.path.join(IMAGES_DIR, instance.__class__.__name__, str(instance.uuid))
