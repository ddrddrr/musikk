from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from users.tests.factories import BaseUserFactory

from streaming.models.songs import CollectionSong
from streaming.tests.factories import BaseSongFactory, CollectionFactory


class TestMeLikedSongsView(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.user = BaseUserFactory()
        cls.url = reverse("api:me-liked-songs")

    def setUp(self):
        self.client = APIClient()

    def test_anonymous_returns_401(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_empty_profile_returns_empty_list(self):
        self.client.force_authenticate(self.user)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, {"song_uuids": []})

    def test_returns_uuids_of_songs_in_liked_collection(self):
        song_a = BaseSongFactory()
        song_b = BaseSongFactory()
        liked = self.user.streamingprofile.liked_songs
        CollectionSong.objects.create(song=song_a, collection=liked)
        CollectionSong.objects.create(song=song_b, collection=liked)

        self.client.force_authenticate(self.user)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            set(response.data["song_uuids"]),
            {str(song_a.uuid), str(song_b.uuid)},
        )

    def test_other_users_likes_are_not_returned(self):
        other_user = BaseUserFactory()
        song = BaseSongFactory()
        CollectionSong.objects.create(
            song=song, collection=other_user.streamingprofile.liked_songs
        )

        self.client.force_authenticate(self.user)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, {"song_uuids": []})


class TestMeLikedCollectionsView(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.user = BaseUserFactory()
        cls.url = reverse("api:me-liked-collections")

    def setUp(self):
        self.client = APIClient()

    def test_anonymous_returns_401(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_empty_profile_returns_empty_list(self):
        self.client.force_authenticate(self.user)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, {"collection_uuids": []})

    def test_returns_uuids_of_liked_collections(self):
        coll_a = CollectionFactory()
        coll_b = CollectionFactory()
        self.user.streamingprofile.liked_collections.add(coll_a, coll_b)

        self.client.force_authenticate(self.user)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            set(response.data["collection_uuids"]),
            {str(coll_a.uuid), str(coll_b.uuid)},
        )

    def test_other_users_likes_are_not_returned(self):
        other_user = BaseUserFactory()
        coll = CollectionFactory()
        other_user.streamingprofile.liked_collections.add(coll)

        self.client.force_authenticate(self.user)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, {"collection_uuids": []})
