from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIRequestFactory, force_authenticate
from faker import Faker

from streaming.tests.factories import BaseSongFactory
from streaming.api.v1.views.collections import CollectionCreateView
from streaming.models import Collection
from streaming.models.collections import CollectionCredit
from users.tests.factories import BaseUserFactory

fake = Faker()


class TestSongCollectionCreateView(TestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.factory = APIRequestFactory()
        cls.user = BaseUserFactory()
        cls.songs = BaseSongFactory.create_batch(2)

    def test_create_with_valid_songs(self):
        url = reverse("api:collection-create")
        payload = {
            "title": fake.word(),
            "type": "playlist",
            "description": fake.text(max_nb_chars=100),
            "songs": [str(song.uuid) for song in self.songs],
        }
        request = self.factory.post(url, payload, format="multipart")
        force_authenticate(request, user=self.user)
        response = CollectionCreateView.as_view()(request)

        # TODO: fix
        self.assertEqual(response.status_code, 201, repr(response.data))
        # self.assertIn("collection", response.data)
        # data = response.data["collection"]
        #
        # collection = Collection.objects.get(uuid=data["uuid"])
        # self.assertEqual(data["title"], payload["title"])
        # self.assertEqual(collection.title, payload["title"])
        #
        # authors = CollectionCredit.objects.filter(collection=collection)
        # self.assertEqual(authors.count(), 1)
        # self.assertEqual(authors.first().author, self.user)

    def test_invalid_song_uuid_returns_400(self):
        url = reverse("api:collection-create")
        payload = {
            "title": fake.word(),
            "type": "playlist",
            "songs": [fake.word(), fake.word()],
        }
        request = self.factory.post(url, payload, format="multipart")
        force_authenticate(request, user=self.user)
        response = CollectionCreateView.as_view()(request)
        self.assertEqual(response.status_code, 400, repr(response.data))
        self.assertIn("failed", response.data)

    def test_no_songs(self):
        url = reverse("api:collection-create")
        payload = {
            "title": fake.word(),
            "type": "playlist",
            "songs": [],
        }
        request = self.factory.post(url, payload, format="multipart")
        force_authenticate(request, user=self.user)
        response = CollectionCreateView.as_view()(request)
        self.assertEqual(response.status_code, 201, repr(response.data))
