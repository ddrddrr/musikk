from django.core.files.storage import default_storage
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIRequestFactory, force_authenticate
from users.tests.factories import BaseUserFactory

from streaming.api.v1.views.songs import (
    CollectionSongRetrieveView,
    SongAddLikedView,
)
from streaming.models.collections import CollectionCredit
from streaming.models.songs import CollectionSong
from streaming.tests.factories import BaseSongFactory, CollectionFactory


class TestCollectionSongRetrieveView(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        self.user = BaseUserFactory()
        self.other_user = BaseUserFactory()

    def test_retrieve_song_from_public_collection(self):
        song = BaseSongFactory(draft=False)
        collection = CollectionFactory(private=False, songs=[song])
        CollectionCredit.objects.create(collection=collection, author=self.other_user)
        collection_song = CollectionSong.objects.get(collection=collection, song=song)

        url = reverse("api:song-retrieve", kwargs={"uuid": collection_song.uuid})
        request = self.factory.get(url)
        force_authenticate(request, user=self.user)
        response = CollectionSongRetrieveView.as_view()(
            request, uuid=collection_song.uuid
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["uuid"], str(collection_song.uuid))
        self.assertIn("song", response.data)
        self.assertEqual(response.data["song"]["uuid"], str(song.uuid))
        self.assertEqual(
            response.data["song"]["mpd"],
            default_storage.url(song.mpd),
        )
        self.assertEqual(
            response.data["song"]["m3u8"],
            default_storage.url(song.m3u8),
        )

    def test_retrieve_song_from_private_collection_as_non_author(self):
        song = BaseSongFactory(draft=False)
        collection = CollectionFactory(private=True, songs=[song])
        CollectionCredit.objects.create(collection=collection, author=self.other_user)
        collection_song = CollectionSong.objects.get(collection=collection, song=song)

        url = reverse("api:song-retrieve", kwargs={"uuid": collection_song.uuid})
        request = self.factory.get(url)
        force_authenticate(request, user=self.user)
        response = CollectionSongRetrieveView.as_view()(
            request, uuid=collection_song.uuid
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_retrieve_song_from_private_collection_as_author(self):
        song = BaseSongFactory(draft=False)
        collection = CollectionFactory(private=True, songs=[song])
        CollectionCredit.objects.create(collection=collection, author=self.user)
        collection_song = CollectionSong.objects.get(collection=collection, song=song)

        url = reverse("api:song-retrieve", kwargs={"uuid": collection_song.uuid})
        request = self.factory.get(url)
        force_authenticate(request, user=self.user)
        response = CollectionSongRetrieveView.as_view()(
            request, uuid=collection_song.uuid
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["uuid"], str(collection_song.uuid))


class TestSongAddLikedView(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        self.user = BaseUserFactory()

    def test_add_song_to_liked(self):
        song = BaseSongFactory(draft=False)
        collection = CollectionFactory(private=False, songs=[song])
        other_user = BaseUserFactory()
        CollectionCredit.objects.create(collection=collection, author=other_user)
        collection_song = CollectionSong.objects.get(collection=collection, song=song)

        url = reverse("api:liked-songs-add", kwargs={"uuid": collection_song.uuid})
        request = self.factory.post(url)
        force_authenticate(request, user=self.user)
        response = SongAddLikedView.as_view()(request, uuid=collection_song.uuid)

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertTrue(
            CollectionSong.objects.filter(
                song=song, collection=self.user.streamingprofile.liked_songs
            ).exists()
        )

    def test_add_song_from_private_collection_fails(self):
        song = BaseSongFactory(draft=False)
        collection = CollectionFactory(private=True, songs=[song])
        other_user = BaseUserFactory()
        CollectionCredit.objects.create(collection=collection, author=other_user)
        collection_song = CollectionSong.objects.get(collection=collection, song=song)

        url = reverse("api:liked-songs-add", kwargs={"uuid": collection_song.uuid})
        request = self.factory.post(url)
        force_authenticate(request, user=self.user)
        response = SongAddLikedView.as_view()(request, uuid=collection_song.uuid)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
