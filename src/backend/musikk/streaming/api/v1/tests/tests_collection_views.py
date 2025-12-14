from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIRequestFactory, force_authenticate
from faker import Faker

from streaming.tests.factories import BaseSongFactory, CollectionFactory
from streaming.api.v1.views.collections import (
    CollectionListCreateView,
    CollectionRetrieveView,
    CollectionDetailView,
    CollectionAddLikedView,
    CollectionRemoveSong,
    CollectionAddSong,
)
from streaming.models import Collection
from streaming.models.collections import CollectionCredit, CollectionType
from streaming.models.songs import CollectionSong
from users.tests.factories import BaseUserFactory, ArtistFactory

fake = Faker()


class TestCollectionCreateView(TestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.factory = APIRequestFactory()
        cls.user = BaseUserFactory()
        cls.artist = ArtistFactory()
        cls.songs = BaseSongFactory.create_batch(2, authors=[cls.artist])

    def test_create_with_valid_songs(self):
        url = reverse("api:collection-list-create")
        payload = {
            "title": fake.word(),
            "type": "playlist",
            "description": fake.text(max_nb_chars=100),
            "songs": [str(song.uuid) for song in self.songs],
        }
        request = self.factory.post(url, payload, format="multipart")
        force_authenticate(request, user=self.artist)
        response = CollectionListCreateView.as_view()(request)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        collection = Collection.objects.filter(title=payload["title"]).first()
        self.assertIsNotNone(collection)
        self.assertEqual(collection.title, payload["title"])
        self.assertEqual(collection.description, payload["description"])
        self.assertEqual(collection.type, CollectionType.PLAYLIST)

        authors = CollectionCredit.objects.filter(collection=collection)
        self.assertEqual(authors.count(), 1)
        self.assertEqual(authors.first().author.uuid, self.artist.uuid)

        collection_songs = CollectionSong.objects.filter(collection=collection)
        self.assertEqual(collection_songs.count(), len(self.songs))

    def test_create_album(self):
        url = reverse("api:collection-list-create")
        payload = {
            "title": fake.word(),
            "type": "album",
            "description": fake.text(max_nb_chars=100),
            "songs": [str(song.uuid) for song in self.songs],
        }
        request = self.factory.post(url, payload, format="multipart")
        force_authenticate(request, user=self.artist)
        response = CollectionListCreateView.as_view()(request)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        collection = Collection.objects.filter(title=payload["title"]).first()
        self.assertEqual(collection.type, CollectionType.ALBUM)

    def test_create_album_default_user_returns_403(self):
        url = reverse("api:collection-list-create")
        payload = {
            "title": fake.word(),
            "type": "album",
            "description": fake.text(max_nb_chars=100),
            "songs": [str(song.uuid) for song in self.songs],
        }
        request = self.factory.post(url, payload, format="multipart")
        force_authenticate(request, user=self.user)
        response = CollectionListCreateView.as_view()(request)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_invalid_song_uuid_returns_400(self):
        url = reverse("api:collection-list-create")
        payload = {
            "title": fake.word(),
            "type": "playlist",
            "songs": [fake.word(), fake.word()],
        }
        request = self.factory.post(url, payload, format="multipart")
        force_authenticate(request, user=self.artist)
        response = CollectionListCreateView.as_view()(request)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_no_songs(self):
        url = reverse("api:collection-list-create")
        payload = {
            "title": fake.word(),
            "type": "playlist",
            "songs": [],
        }
        request = self.factory.post(url, payload, format="multipart")
        force_authenticate(request, user=self.artist)
        response = CollectionListCreateView.as_view()(request)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        collection = Collection.objects.filter(title=payload["title"]).first()
        self.assertIsNotNone(collection)
        self.assertEqual(
            CollectionSong.objects.filter(collection=collection).count(), 0
        )


class TestCollectionRetrieveView(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        self.artist = BaseUserFactory()
        self.other_user = BaseUserFactory()

    def test_retrieve_public_collection(self):
        collection = CollectionFactory(private=False)
        CollectionCredit.objects.create(collection=collection, author=self.other_user)

        url = reverse("api:collection-retrieve", kwargs={"uuid": collection.uuid})
        request = self.factory.get(url)
        force_authenticate(request, user=self.artist)
        response = CollectionRetrieveView.as_view()(request, uuid=collection.uuid)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["uuid"], str(collection.uuid))
        self.assertEqual(response.data["title"], collection.title)

    def test_retrieve_private_collection_as_author(self):
        collection = CollectionFactory(private=True)
        CollectionCredit.objects.create(collection=collection, author=self.artist)

        url = reverse("api:collection-retrieve", kwargs={"uuid": collection.uuid})
        request = self.factory.get(url)
        force_authenticate(request, user=self.artist)
        response = CollectionRetrieveView.as_view()(request, uuid=collection.uuid)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["uuid"], str(collection.uuid))

    def test_retrieve_private_collection_as_non_author(self):
        collection = CollectionFactory(private=True)
        CollectionCredit.objects.create(collection=collection, author=self.other_user)

        url = reverse("api:collection-retrieve", kwargs={"uuid": collection.uuid})
        request = self.factory.get(url)
        force_authenticate(request, user=self.artist)
        response = CollectionRetrieveView.as_view()(request, uuid=collection.uuid)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class TestCollectionDetailView(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        self.artist = BaseUserFactory()
        self.songs = BaseSongFactory.create_batch(3, draft=False)

    def test_retrieve_collection_with_songs(self):
        collection = CollectionFactory(private=False, songs=self.songs)
        CollectionCredit.objects.create(collection=collection, author=self.artist)

        url = reverse("api:collection-detail", kwargs={"uuid": collection.uuid})
        request = self.factory.get(url)
        force_authenticate(request, user=self.artist)
        response = CollectionDetailView.as_view()(request, uuid=collection.uuid)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["uuid"], str(collection.uuid))
        self.assertIn("songs", response.data)
        self.assertEqual(len(response.data["songs"]), 3)


class TestCollectionAddLikedView(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        self.artist = BaseUserFactory()

    def test_add_public_collection_to_liked(self):
        collection = CollectionFactory(private=False)
        other_user = BaseUserFactory()
        CollectionCredit.objects.create(collection=collection, author=other_user)

        url = reverse("api:collection-add-liked", kwargs={"uuid": collection.uuid})
        request = self.factory.post(url)
        force_authenticate(request, user=self.artist)
        response = CollectionAddLikedView.as_view()(request, uuid=collection.uuid)

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertTrue(
            self.artist.streamingprofile.followed_collections.filter(
                uuid=collection.uuid
            ).exists()
        )


class TestCollectionRemoveSong(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        self.artist = BaseUserFactory()
        self.other_user = BaseUserFactory()

    def test_remove_song_as_author(self):
        song = BaseSongFactory()
        collection = CollectionFactory(private=False, songs=[song])
        CollectionCredit.objects.create(collection=collection, author=self.artist)
        collection_song = CollectionSong.objects.get(collection=collection, song=song)

        url = reverse(
            "api:collection-remove-song",
            kwargs={
                "collection_uuid": collection.uuid,
                "song_uuid": collection_song.uuid,
            },
        )
        request = self.factory.delete(url)
        force_authenticate(request, user=self.artist)
        response = CollectionRemoveSong.as_view()(
            request, collection_uuid=collection.uuid, song_uuid=collection_song.uuid
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(
            CollectionSong.objects.filter(uuid=collection_song.uuid).exists()
        )

    def test_remove_song_as_non_author(self):
        song = BaseSongFactory()
        collection = CollectionFactory(private=False, songs=[song])
        CollectionCredit.objects.create(collection=collection, author=self.other_user)
        collection_song = CollectionSong.objects.get(collection=collection, song=song)

        url = reverse(
            "api:collection-remove-song",
            kwargs={
                "collection_uuid": collection.uuid,
                "song_uuid": collection_song.uuid,
            },
        )
        request = self.factory.delete(url)
        force_authenticate(request, user=self.artist)
        response = CollectionRemoveSong.as_view()(
            request, collection_uuid=collection.uuid, song_uuid=collection_song.uuid
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class TestCollectionAddSong(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        self.artist = BaseUserFactory()

    def test_add_song_as_author(self):
        song = BaseSongFactory()
        source_collection = CollectionFactory(private=False, songs=[song])
        target_collection = CollectionFactory(private=False, songs=[])
        CollectionCredit.objects.create(
            collection=target_collection, author=self.artist
        )

        collection_song = CollectionSong.objects.get(
            collection=source_collection, song=song
        )

        url = reverse(
            "api:collection-add-song",
            kwargs={
                "collection_uuid": target_collection.uuid,
                "song_uuid": collection_song.uuid,
            },
        )
        request = self.factory.post(url)
        force_authenticate(request, user=self.artist)
        response = CollectionAddSong.as_view()(
            request,
            collection_uuid=target_collection.uuid,
            song_uuid=collection_song.uuid,
        )

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertTrue(
            CollectionSong.objects.filter(
                collection=target_collection, song=song
            ).exists()
        )
