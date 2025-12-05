from django.test import TestCase
from django.urls.base import reverse
from rest_framework.test import APIRequestFactory

from streaming.tests.factories import BaseSongFactory, CollectionFactory
from recommendations.api.v1.views import SearchView
from rest_framework.test import force_authenticate

from users.tests.factories import BaseUserFactory


# TODO: rewrite with client instead of factory
class TestSearchView(TestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.factory = APIRequestFactory()
        cls.user = BaseUserFactory()

        cls.collections = CollectionFactory.create_batch(2)
        cls.songs = [song for c in cls.collections for song in c.base_songs.all()]

    def test_empty_q_string(self):
        request = self.factory.get(reverse("api:search"))
        force_authenticate(user=self.user, request=request)
        response = SearchView.as_view()(request)
        self.assertEqual(response.status_code, 204)

    def test_q_string_equal_collection_title(self):
        query = f"?q={self.collections[0].title}"
        request = self.factory.get(reverse("api:search") + query)
        force_authenticate(user=self.user, request=request)
        response = SearchView.as_view()(request)
        self.assertEqual(response.status_code, 200)
        self.assertTrue(len(response.data["playlists"]) + len(response.data["albums"]))

    def test_q_string_equal_song_title(self):
        query = f"?q={self.songs[0].title}"
        request = self.factory.get(reverse("api:search") + query)
        force_authenticate(user=self.user, request=request)
        response = SearchView.as_view()(request)
        self.assertEqual(response.status_code, 200)
        self.assertTrue(len(response.data["songs"]))

    def test_q_string_multiple_similar_collection_titles(self):
        for collection in self.collections:
            CollectionFactory(title=(collection.title + "a"))
            CollectionFactory(title=(collection.title + "b"))

        query = f"?q={self.collections[0].title}"
        request = self.factory.get(reverse("api:search") + query)
        force_authenticate(user=self.user, request=request)
        response = SearchView.as_view()(request)
        self.assertEqual(response.status_code, 200)
        self.assertTrue(
            (len(response.data["playlists"]) + len(response.data["albums"])) >= 3
        )

    def test_q_equal_user_title(self):
        query = f"?q={self.user.display_name}"
        request = self.factory.get(reverse("api:search") + query)
        force_authenticate(user=self.user, request=request)
        response = SearchView.as_view()(request)
        self.assertEqual(response.status_code, 200)
        self.assertTrue(len(response.data["users"]) == 1)

    def test_q_multiple_similar_user_titles(self):
        query = f"?q={self.user.display_name}"
        for i in range(5):
            u1 = BaseUserFactory()
            u1.display_name = self.user.display_name + str(i)
            u1.save()

            u2 = BaseUserFactory()
            u2.display_name = str(i)
            u2.save()

        request = self.factory.get(reverse("api:search") + query)
        force_authenticate(user=self.user, request=request)
        response = SearchView.as_view()(request)
        self.assertEqual(response.status_code, 200)
        self.assertTrue(len(response.data["users"]) >= 3)
