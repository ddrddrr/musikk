from django.test import TestCase
from django.urls.base import reverse
from rest_framework.test import APIRequestFactory, force_authenticate
from streaming.tests.factories import BaseSongFactory, CollectionFactory
from users.tests.factories import BaseUserFactory

from recommendations.api.v1.views import SearchView


# TODO: rewrite with client instead of factory
class TestSearchView(TestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.factory = APIRequestFactory()
        cls.user = BaseUserFactory()

        cls.collections = CollectionFactory.create_batch(2, type="album", private=False)
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

    def _search(self, q):
        request = self.factory.get(reverse("api:search"), {"q": q})
        force_authenticate(user=self.user, request=request)
        return SearchView.as_view()(request)

    def test_start_of_a_word_finds_a_long_title(self):
        song = BaseSongFactory(title="Love Me Tender")
        CollectionFactory(type="album", private=False, songs=[song])

        response = self._search("lov")

        self.assertEqual(response.status_code, 200)
        titles = [entry["song"]["title"] for entry in response.data["songs"]]
        self.assertIn("Love Me Tender", titles)

    def test_songs_come_in_order_of_similarity_not_album_position(self):
        # both titles contain the query, and the longer one is first in the album
        long_title = BaseSongFactory(title="Love Me Tender")
        short_title = BaseSongFactory(title="Love Me")
        CollectionFactory(type="album", private=False, songs=[long_title, short_title])

        response = self._search("love me")

        self.assertEqual(response.status_code, 200)
        titles = [entry["song"]["title"] for entry in response.data["songs"]]
        self.assertEqual(titles[:2], ["Love Me", "Love Me Tender"])
