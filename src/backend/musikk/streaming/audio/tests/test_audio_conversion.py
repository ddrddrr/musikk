import os
import shutil
import tempfile
import uuid
from pathlib import Path

from django.test import TestCase, override_settings
from django.core.files.storage import default_storage

from musikk.utils.storage import delete_django_storage_dir
from streaming.audio.ffmpeg_conf.ffmpeg_wrapper import FFMPEGFlacOnly, FFMPEGFull


class TestFFMPEGConversion(TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        super().setUpClass()
        cls._tmp_media = tempfile.mkdtemp()

        cls.override = override_settings(
            DEFAULT_FILE_STORAGE="django.core.files.storage.FileSystemStorage",
            MEDIA_ROOT=cls._tmp_media,
        )
        cls.override.enable()

        tests_dir = Path(__file__).parent
        cls.input_file = tests_dir / "data" / "file1.wav"
        assert cls.input_file.exists(), f"Test input_file not found: {cls.input_file}"

    def test_flac_conversion_creates_files_in_storage(self):
        storage_subdir = uuid.uuid4().hex
        storage_dir_path = Path(os.path.join(self._tmp_media, storage_subdir))
        storage_dir_path.mkdir(exist_ok=True, parents=True)
        results = FFMPEGFlacOnly.convert_audio(
            file_path=self.input_file, storage_dir=storage_subdir
        )
        self.assertIsInstance(results, list)
        self.assertTrue(len(results) > 0, "No files were returned from convert_audio")
        for saved_path in results:
            self.assertTrue(
                default_storage.exists(saved_path),
                f"Expected saved file to exist in storage: {saved_path}",
            )

        delete_django_storage_dir(storage_subdir)

    def test_all_codecs_convert_and_save(self):
        storage_subdir = uuid.uuid4().hex
        storage_dir_path = Path(os.path.join(self._tmp_media, storage_subdir))
        storage_dir_path.mkdir(exist_ok=True, parents=True)
        results = FFMPEGFull.convert_audio(
            file_path=self.input_file, storage_dir=storage_subdir
        )
        self.assertIsInstance(results, list)
        self.assertTrue(
            len(results) > 0, "No files were returned from convert_audio for FFMPEGFull"
        )
        for saved_path in results:
            self.assertTrue(
                default_storage.exists(saved_path),
                f"Expected saved file to exist in storage: {saved_path}",
            )

        delete_django_storage_dir(storage_subdir)

    @classmethod
    def tearDownClass(cls):
        cls.override.disable()
        shutil.rmtree(cls._tmp_media)
        super().tearDownClass()
