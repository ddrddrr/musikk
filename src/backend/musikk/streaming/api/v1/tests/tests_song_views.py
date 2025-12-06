import io
from unittest.mock import patch, MagicMock
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIRequestFactory, force_authenticate
from rest_framework.exceptions import ValidationError
from faker import Faker

from streaming.api.v1.views.songs import (
    SongCreateView,
    CollectionSongRetrieveView,
    SongAddLikedView,
)
from streaming.models.songs import BaseSong, CollectionSong
from streaming.tests.factories import BaseSongFactory, CollectionFactory
from streaming.models.collections import CollectionCredit
from users.tests.factories import BaseUserFactory, ArtistFactory

fake = Faker()


class TestSongCreateView(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        self.artist = ArtistFactory()
        self.user = self.artist

    @patch("streaming.api.v1.views.songs.validate_audio")
    @patch("streaming.api.v1.views.songs.convert_audio.apply_async")
    def test_song_create_with_multiple_authors(self, mock_convert, mock_validate):
        mock_validate.return_value = None
        mock_convert.return_value = MagicMock(id="task-id-456")

        other_artist = ArtistFactory()
        audio_file = io.BytesIO(b"fake audio content")
        audio_file.name = "test_song.mp3"

        url = reverse("api:song-create")
        payload = {
            "title": fake.word(),
            "description": fake.text(max_nb_chars=100),
            "audio": audio_file,
            "authors": [str(self.user.uuid), str(other_artist.uuid)],
        }

        request = self.factory.post(url, payload, format="multipart")
        force_authenticate(request, user=self.user)
        response = SongCreateView.as_view()(request)

        self.assertEqual(response.status_code, status.HTTP_202_ACCEPTED)

        song = BaseSong.objects.get(uuid=response.data["uuid"])
        self.assertEqual(song.credits.count(), 2)

    @patch("streaming.api.v1.views.songs.validate_audio")
    def test_song_create_validation_failure(self, mock_validate):
        mock_validate.side_effect = ValidationError("Invalid audio format")

        audio_file = io.BytesIO(b"fake audio content")
        audio_file.name = "test_song.mp3"

        url = reverse("api:song-create")
        payload = {
            "title": fake.word(),
            "audio": audio_file,
        }

        request = self.factory.post(url, payload, format="multipart")
        force_authenticate(request, user=self.user)
        response = SongCreateView.as_view()(request)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        mock_validate.assert_called_once()


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
