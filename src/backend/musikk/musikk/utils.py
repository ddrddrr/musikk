import os

from django.conf import settings


def image_path(instance, filename):
    return os.path.join(
        settings.MEDIA_ROOT, instance.__class__.__name__, "images", str(instance.uuid)
    )
