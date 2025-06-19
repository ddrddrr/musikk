import os
import shutil
import tempfile
import uuid

import requests

from django.test import TestCase, override_settings
from django.conf import settings
from django.core.files.storage import default_storage

from musikk.utils.tests import AUDIO_URL_1, AUDIO_URL_2
from streaming.audio.ffmpeg_wrapper import FFMPEGWrapper, StreamingProtocol, FFMPEGFull, ManifestType
from streaming.audio.converters import (
    FLAC_CONVERTER,
    AACHEv2_CONVERTER,
    OPUS_CONVERTER,
)


class TestFFMPEGWrapper(TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        super().setUpClass()

        cls._tmp_media = tempfile.mkdtemp()

        cls.override = override_settings(
            DEFAULT_FILE_STORAGE='django.core.files.storage.FileSystemStorage',
            MEDIA_ROOT=cls._tmp_media
        )
        cls.override.enable()

        cls.tmpfile_1_path = os.path.join(cls._tmp_media, "input1.wav")
        cls.tmpfile_2_path = os.path.join(cls._tmp_media, "input2.wav")

        with open(cls.tmpfile_1_path, "wb") as f1:
            f1.write(requests.get(AUDIO_URL_1).content)

        with open(cls.tmpfile_2_path, "wb") as f2:
            f2.write(requests.get(AUDIO_URL_2).content)

    def test_convert_flac_basic(self):
        r = str(uuid.uuid4())
        ffmpeg = FFMPEGWrapper().add_converter(StreamingProtocol.DASH, FLAC_CONVERTER)

        ret = ffmpeg.convert_audio(
            file_path=self.tmpfile_1_path,
            storage_dir=os.path.join(settings.AUDIO_CONTENT_PATH, r),
            out_file_prefix=r
        )
        self.assertTrue(ret)
        self.assertTrue(ret.manifests[ManifestType.MPD])
        self.assertTrue(default_storage.exists(ret.manifests[ManifestType.MPD]))
        FFMPEGWrapper._cleanup(ret.content_path)

    def test_convert_multiple_encoders(self):
        r = str(uuid.uuid4())

        ffmpeg = (
            FFMPEGWrapper()
            .add_converter(StreamingProtocol.DASH, FLAC_CONVERTER)
            .add_converter(StreamingProtocol.DASH, AACHEv2_CONVERTER)
            .add_converter(StreamingProtocol.DASH, OPUS_CONVERTER)
        )
        ret = ffmpeg.convert_audio(
            file_path=self.tmpfile_1_path,
            storage_dir=os.path.join(settings.AUDIO_CONTENT_PATH, r),
            out_file_prefix=str(uuid.uuid4())
        )
        self.assertTrue(ret)
        self.assertTrue(ret.manifests[ManifestType.MPD])
        self.assertTrue(default_storage.exists(ret.manifests[ManifestType.MPD]))
        FFMPEGWrapper._cleanup(ret.content_path)

    def test_convert_full(self):
        r = str(uuid.uuid4())

        ret = FFMPEGFull.convert_audio(
            file_path=self.tmpfile_2_path,
            storage_dir=os.path.join(settings.AUDIO_CONTENT_PATH, r),
            out_file_prefix=r,
        )
        self.assertTrue(ret)
        self.assertTrue(ret.manifests[ManifestType.MPD])
        self.assertTrue(default_storage.exists(ret.manifests[ManifestType.MPD]))
        self.assertTrue(ret.manifests[ManifestType.M3U8])
        self.assertTrue(default_storage.exists(ret.manifests[ManifestType.M3U8]))
        FFMPEGWrapper._cleanup(ret.content_path)

    @classmethod
    def tearDownClass(cls):
        cls.override.disable()
        shutil.rmtree(cls._tmp_media)
        super().tearDownClass()
