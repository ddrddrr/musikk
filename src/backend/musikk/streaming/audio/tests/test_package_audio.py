import shutil
import tempfile
import uuid
from pathlib import Path

from django.test import TestCase, override_settings
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from musikk.utils.storage import delete_django_storage_dir

from streaming.audio.shaka_packager_conf.shaka_packager_wrapper import (
    ShakaPackagerMPDAndM3U8,
    ManifestType,
)


# TODO: mark as integration
class TestShakaPackagerWrapper(TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        super().setUpClass()
        cls.tmp_media_dir = tempfile.mkdtemp()

        cls.override = override_settings(
            DEFAULT_FILE_STORAGE="django.core.files.storage.FileSystemStorage",
            MEDIA_ROOT=cls.tmp_media_dir,
        )
        cls.override.enable()

        tests_dir = Path(__file__).parent
        cls.flac_mp4 = (
            tests_dir / "data" / "flac-None-7d83054b539f4e1ebfa772d2d609b0a0.mp4"
        )
        cls.opus_256_mp4 = (
            tests_dir / "data" / "libopus-256-d802e447dde24e1f94ae76299944bb47.mp4"
        )
        cls.aac_320_mp4 = (
            tests_dir / "data" / "libfdk_aac-320-080c93c30bcd48c2accef375dac2fc68.mp4"
        )

        assert cls.flac_mp4.exists(), f"Test input file not found: {cls.flac_mp4}"
        assert (
            cls.opus_256_mp4.exists()
        ), f"Test input file not found: {cls.opus_256_mp4}"
        assert cls.aac_320_mp4.exists(), f"Test input file not found: {cls.aac_320_mp4}"

    def test_package_flac_success(self):
        # prepare storage dir and save single input file into django storage
        storage_subdir = uuid.uuid4().hex
        storage_path = f"{storage_subdir}/{self.flac_mp4.name}"
        with open(self.flac_mp4, "rb") as fh:
            default_storage.save(storage_path, ContentFile(fh.read()))

        result = ShakaPackagerMPDAndM3U8.package_audio_files(
            input_storage_paths=[storage_path], storage_dir=storage_subdir
        )

        # verify manifests are present in returned representation and exist in storage
        self.assertIn(ManifestType.MPD, result.manifests)
        self.assertIn(ManifestType.M3U8, result.manifests)
        self.assertTrue(
            default_storage.exists(result.manifests[ManifestType.MPD]),
            "MPD manifest was not saved to storage",
        )
        self.assertTrue(
            default_storage.exists(result.manifests[ManifestType.M3U8]),
            "HLS master playlist was not saved to storage",
        )

        delete_django_storage_dir(storage_subdir)

    def test_package_multiple_success(self):
        storage_subdir = uuid.uuid4().hex
        paths = []
        for src in (self.flac_mp4, self.opus_256_mp4, self.aac_320_mp4):
            storage_path = f"{storage_subdir}/{src.name}"
            with open(src, "rb") as fh:
                default_storage.save(storage_path, ContentFile(fh.read()))
            paths.append(storage_path)

        result = ShakaPackagerMPDAndM3U8.package_audio_files(
            input_storage_paths=paths, storage_dir=storage_subdir
        )

        self.assertIn(ManifestType.MPD, result.manifests)
        self.assertIn(ManifestType.M3U8, result.manifests)
        self.assertTrue(default_storage.exists(result.manifests[ManifestType.MPD]))
        self.assertTrue(default_storage.exists(result.manifests[ManifestType.M3U8]))

        delete_django_storage_dir(storage_subdir)

    @classmethod
    def tearDownClass(cls):
        cls.override.disable()
        shutil.rmtree(cls.tmp_media_dir)
        super().tearDownClass()
