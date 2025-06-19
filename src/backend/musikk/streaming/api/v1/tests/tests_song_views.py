import io
import os
import shutil
import tempfile
import requests
from django.test import TestCase, override_settings
from django.core.files.storage import default_storage
from django.test.client import MULTIPART_CONTENT, encode_multipart, BOUNDARY
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIRequestFactory, force_authenticate
from faker import Faker

from musikk.utils.tests import AUDIO_URL_1
from streaming.api.v1.views.views_song import SongCreateView
from users.tests.factories import ArtistFactory
from streaming.songs import BaseSong

fake = Faker()


@override_settings(
    DEFAULT_FILE_STORAGE='django.core.files.storage.FileSystemStorage',
)
class TestSongCreateView(TestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()

        cls._tmp_media = tempfile.mkdtemp()
        cls._override = override_settings(
            MEDIA_ROOT=cls._tmp_media,
            DEFAULT_FILE_STORAGE='django.core.files.storage.FileSystemStorage',
        )
        cls._override.enable()

        cls.factory = APIRequestFactory()
        cls.artists = ArtistFactory.create_batch(5)
        cls.main_artist = cls.artists[0]

        response = requests.get(AUDIO_URL_1)
        cls.audio_content = response.content
        cls.audio_file = io.BytesIO(cls.audio_content)
        cls.audio_file.name = f"{fake.word()}.wav"

    @classmethod
    def tearDownClass(cls):
        cls._override.disable()
        shutil.rmtree(cls._tmp_media)
        super().tearDownClass()

    def test_song_create_view_simple(self):
        url = reverse("api:song-create")

        payload = {
            "title": fake.word(),
            "description": fake.text(max_nb_chars=100),
            "audio": self.audio_file,
            "authors": [str(a.uuid) for a in self.artists],
        }
        encoded = encode_multipart(BOUNDARY, payload)
        content_type = MULTIPART_CONTENT + f"; boundary={BOUNDARY}"

        request = self.factory.post(path=url, data=encoded, content_type=content_type)
        force_authenticate(request, user=self.main_artist)
        response = SongCreateView.as_view()(request)

        self.assertEqual(response.status_code, status.HTTP_202_ACCEPTED, repr(response.data))
        self.assertIn("uuid", response.data)

        song = BaseSong.objects.get(uuid=response.data["uuid"])
        mpd_path = os.path.join(song.content_path, f"{song.uuid}.mpd")
        m3u8_path = os.path.join(song.content_path, f"{song.uuid}.m3u8")
        self.assertTrue(default_storage.exists(mpd_path))
        self.assertTrue(default_storage.exists(m3u8_path))
