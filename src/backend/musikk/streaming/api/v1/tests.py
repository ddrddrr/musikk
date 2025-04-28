from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIRequestFactory, force_authenticate
from faker import Faker


from users.tests.factories import BaseUserFactory, StreamingUserFactory
from streaming.tests.factories import BaseSongFactory
from streaming.api.v1.views import SongCollectionCreateView
from streaming.models import SongCollection
from streaming.song_collections import SongCollectionAuthor

fake = Faker()


class TestSongCollectionCreateView(TestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.factory = APIRequestFactory()
        cls.user = StreamingUserFactory()
        cls.songs = BaseSongFactory.create_batch(2)

    def test_create_with_valid_songs(self):
        url = reverse("api:collection-create")
        payload = {
            "title": fake.word(),
            "description": fake.text(max_nb_chars=100),
            "songs": [str(song.uuid) for song in self.songs],
        }
        request = self.factory.post(url, payload, format="multipart")
        force_authenticate(request, user=self.user)
        response = SongCollectionCreateView.as_view()(request)
        self.assertEqual(response.status_code, 201)
        self.assertIn("collection", response.data)
        data = response.data["collection"]

        collection = SongCollection.objects.get(uuid=data["uuid"])
        self.assertEqual(data["title"], payload["title"])
        self.assertEqual(collection.title, payload["title"])

        authors = SongCollectionAuthor.objects.filter(song_collection=collection)
        self.assertEqual(authors.count(), 1)
        self.assertEqual(authors.first().author, self.user)

    def test_invalid_song_uuid_returns_400(self):
        url = reverse("api:collection-create")
        payload = {
            "title": fake.word(),
            "songs": [fake.word(), fake.word()],
        }
        request = self.factory.post(url, payload, format="multipart")
        force_authenticate(request, user=self.user)
        response = SongCollectionCreateView.as_view()(request)
        self.assertEqual(response.status_code, 400)
        self.assertIn("failed", response.data)

    def test_no_songs(self):
        url = reverse("api:collection-create")
        payload = {
            "title": fake.word(),
            "songs": [],
        }
        request = self.factory.post(url, payload, format="multipart")
        force_authenticate(request, user=self.user)
        response = SongCollectionCreateView.as_view()(request)
        self.assertEqual(response.status_code, 201)
        self.assertIn("collection", response.data)
