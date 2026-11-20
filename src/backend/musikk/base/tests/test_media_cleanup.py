import os
import shutil
import tempfile
from datetime import timedelta

from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.test import TestCase, override_settings
from django.utils import timezone
from users.tests.factories import BaseUserFactory

from base.media_cleanup import ORPHAN_IMAGE_MIN_AGE, delete_orphan_images


class DeleteOrphanImagesTest(TestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.media_root = tempfile.mkdtemp()
        cls.override = override_settings(MEDIA_ROOT=cls.media_root)
        cls.override.enable()

    @classmethod
    def tearDownClass(cls):
        cls.override.disable()
        shutil.rmtree(cls.media_root, ignore_errors=True)
        super().tearDownClass()

    def _make_old(self, name: str) -> None:
        timestamp = (
            timezone.now() - ORPHAN_IMAGE_MIN_AGE - timedelta(minutes=1)
        ).timestamp()
        os.utime(default_storage.path(name), (timestamp, timestamp))

    def test_only_old_unreferenced_images_are_deleted(self):
        user = BaseUserFactory()
        user.avatar.save("first.png", ContentFile(b"first"))
        replaced = user.avatar.name
        user.avatar.save("second.png", ContentFile(b"second"))
        current = user.avatar.name
        young_orphan = default_storage.save(
            "images/BaseUser/young", ContentFile(b"young")
        )
        self._make_old(replaced)
        self._make_old(current)

        delete_orphan_images(timezone.now())

        self.assertFalse(default_storage.exists(replaced))
        self.assertTrue(default_storage.exists(current))
        self.assertTrue(default_storage.exists(young_orphan))
