import logging
from datetime import datetime, timedelta

from django.apps import apps
from django.core.files.storage import default_storage
from django.db import models
from utils.paths import IMAGES_DIR
from utils.storage import walk_django_storage_files

logger = logging.getLogger(__name__)

# Django writes the file before it saves the row, and the row is visible to
# other connections only after the commit
ORPHAN_IMAGE_MIN_AGE = timedelta(hours=1)


def delete_orphan_images(now: datetime) -> None:
    referenced = _referenced_file_names()
    max_modified_time = now - ORPHAN_IMAGE_MIN_AGE
    for name in walk_django_storage_files(IMAGES_DIR):
        if name in referenced:
            continue
        try:
            if default_storage.get_modified_time(name) < max_modified_time:
                default_storage.delete(name)
                logger.info(f"Deleted orphan image {name}")
        except OSError:
            logger.exception(f"Failed to delete orphan image {name}")


def _referenced_file_names() -> set[str]:
    names: set[str] = set()
    for model in apps.get_models():
        for field in model._meta.local_concrete_fields:
            if isinstance(field, models.FileField):
                names.update(model._base_manager.values_list(field.attname, flat=True))
    return names
