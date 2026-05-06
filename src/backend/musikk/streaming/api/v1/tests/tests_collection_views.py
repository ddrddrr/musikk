import io
from unittest.mock import MagicMock, patch

from django.test import TestCase
from django.urls import reverse
from faker import Faker
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.test import APIRequestFactory, force_authenticate
from users.tests.factories import ArtistFactory, BaseUserFactory

from streaming.api.v1.views.collections import (
    AlbumBySongView,
    CollectionAddLikedView,
    CollectionListCreateView,
    CollectionPersonalView,
    CollectionRemoveSong,
    CollectionRetrieveUpdateView,
    CollectionRetrieveView,
    CollectionSongCreateView,
)
from streaming.audio.probes import AudioStreamInfo
from streaming.models import Collection
from streaming.models.collections import CollectionCredit, CollectionType
from streaming.models.songs import BaseSong, CollectionSong
from streaming.tests.factories import BaseSongFactory, CollectionFactory

fake = Faker()


class TestCollectionCreateView(TestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.factory = APIRequestFactory()
        cls.user = BaseUserFactory()
        cls.artist = ArtistFactory()
        cls.songs = BaseSongFactory.create_batch(2, authors=[cls.artist])

    def test_create_playlist_as_artist(self):
        url = reverse("api:collection-list-create")
        payload = {
            "title": fake.word(),
            "type": "playlist",
            "description": fake.text(max_nb_chars=100),
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

    def test_create_playlist_as_default_user(self):
        url = reverse("api:collection-list-create")
        payload = {
            "title": fake.word(),
            "type": "playlist",
            "description": fake.text(max_nb_chars=100),
        }
        request = self.factory.post(url, payload, format="multipart")
        force_authenticate(request, user=self.user)
        response = CollectionListCreateView.as_view()(request)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        collection = Collection.objects.filter(title=payload["title"]).first()
        self.assertIsNotNone(collection)
        self.assertEqual(collection.type, CollectionType.PLAYLIST)

        authors = CollectionCredit.objects.filter(collection=collection)
        self.assertEqual(authors.count(), 1)
        self.assertEqual(authors.first().author.uuid, self.user.uuid)

    def test_create_album_as_artist(self):
        url = reverse("api:collection-list-create")
        payload = {
            "title": fake.word(),
            "type": "album",
            "description": fake.text(max_nb_chars=100),
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
        }
        request = self.factory.post(url, payload, format="multipart")
        force_authenticate(request, user=self.user)
        response = CollectionListCreateView.as_view()(request)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


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


class TestCollectionRetrieveUpdateView(TestCase):
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
        response = CollectionRetrieveUpdateView.as_view()(request, uuid=collection.uuid)

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


class TestCollectionDeleteView(TestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.factory = APIRequestFactory()
        cls.author = BaseUserFactory()
        cls.other_user = BaseUserFactory()

    def test_delete_playlist_as_author(self):
        collection = CollectionFactory(type="playlist", songs=[])
        CollectionCredit.objects.create(collection=collection, author=self.author)

        url = reverse("api:collection-retrieve", kwargs={"uuid": collection.uuid})
        request = self.factory.delete(url)
        force_authenticate(request, user=self.author)
        response = CollectionRetrieveView.as_view()(request, uuid=collection.uuid)

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Collection.objects.filter(uuid=collection.uuid).exists())

    def test_delete_playlist_as_non_author_returns_403(self):
        collection = CollectionFactory(type="playlist", songs=[])
        CollectionCredit.objects.create(collection=collection, author=self.other_user)

        url = reverse("api:collection-retrieve", kwargs={"uuid": collection.uuid})
        request = self.factory.delete(url)
        force_authenticate(request, user=self.author)
        response = CollectionRetrieveView.as_view()(request, uuid=collection.uuid)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(Collection.objects.filter(uuid=collection.uuid).exists())

    def test_delete_album_returns_400(self):
        collection = CollectionFactory(type="album", songs=[])
        CollectionCredit.objects.create(collection=collection, author=self.author)

        url = reverse("api:collection-retrieve", kwargs={"uuid": collection.uuid})
        request = self.factory.delete(url)
        force_authenticate(request, user=self.author)
        response = CollectionRetrieveView.as_view()(request, uuid=collection.uuid)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["detail"], "Only playlists can be deleted.")
        self.assertTrue(Collection.objects.filter(uuid=collection.uuid).exists())

    def test_delete_nonexistent_collection_returns_404(self):
        import uuid as uuid_mod

        random_uuid = uuid_mod.uuid4()
        url = reverse("api:collection-retrieve", kwargs={"uuid": random_uuid})
        request = self.factory.delete(url)
        force_authenticate(request, user=self.author)
        response = CollectionRetrieveView.as_view()(request, uuid=random_uuid)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class TestCollectionSongCreateView(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        self.artist = BaseUserFactory()

    def test_add_song_to_playlist_as_author(self):
        song = BaseSongFactory()
        target_collection = CollectionFactory(private=False, type="playlist", songs=[])
        CollectionCredit.objects.create(
            collection=target_collection, author=self.artist
        )

        url = reverse(
            "api:collection-song-create",
            kwargs={"collection_uuid": target_collection.uuid},
        )
        request = self.factory.post(url, {"song_uuid": str(song.uuid)}, format="json")
        force_authenticate(request, user=self.artist)
        response = CollectionSongCreateView.as_view()(
            request, collection_uuid=target_collection.uuid
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["song_uuid"], str(song.uuid))
        self.assertTrue(
            CollectionSong.objects.filter(
                collection=target_collection, song=song
            ).exists()
        )


class TestCollectionSongCreateViewAlbumUpload(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        self.artist = ArtistFactory()
        self.collection = CollectionFactory(private=False, type="album", songs=[])
        CollectionCredit.objects.create(collection=self.collection, author=self.artist)

    def _upload_payload(self, **overrides):
        audio_file = io.BytesIO(b"fake audio content")
        audio_file.name = "test_song.mp3"
        payload = {
            "title": fake.word(),
            "description": fake.text(max_nb_chars=100),
            "audio": audio_file,
            "authors": [str(self.artist.uuid)],
            "operation_id": "op-test-123",
        }
        payload.update(overrides)
        return payload

    @patch("streaming.api.v1.views.collections.validate_audio")
    @patch("streaming.api.v1.views.collections.convert_audio.apply_async")
    def test_album_song_create_with_multiple_authors(self, mock_convert, mock_validate):
        mock_validate.return_value = AudioStreamInfo(
            duration_seconds=180.0,
            sample_rate=44100,
            channels=2,
            codec_name="mp3",
            bit_depth=None,
            bit_rate=320000,
        )
        mock_convert.return_value = MagicMock(id="task-id-456")

        other_artist = ArtistFactory()
        url = reverse(
            "api:collection-song-create",
            kwargs={"collection_uuid": self.collection.uuid},
        )
        payload = self._upload_payload(
            authors=[str(self.artist.uuid), str(other_artist.uuid)]
        )

        request = self.factory.post(url, payload, format="multipart")
        force_authenticate(request, user=self.artist)
        response = CollectionSongCreateView.as_view()(
            request, collection_uuid=self.collection.uuid
        )

        self.assertEqual(response.status_code, status.HTTP_202_ACCEPTED)

        song = BaseSong.objects.get(uuid=response.data["song_uuid"])
        self.assertEqual(song.credits.count(), 2)

    @patch("streaming.api.v1.views.collections.validate_audio")
    def test_album_song_create_validation_failure(self, mock_validate):
        mock_validate.side_effect = ValidationError("Invalid audio format")

        url = reverse(
            "api:collection-song-create",
            kwargs={"collection_uuid": self.collection.uuid},
        )
        request = self.factory.post(url, self._upload_payload(), format="multipart")
        force_authenticate(request, user=self.artist)
        response = CollectionSongCreateView.as_view()(
            request, collection_uuid=self.collection.uuid
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        mock_validate.assert_called_once()


class TestCollectionDraftOnCreate(TestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.factory = APIRequestFactory()
        cls.artist = ArtistFactory()

    def _create(self, payload):
        request = self.factory.post(
            reverse("api:collection-list-create"), payload, format="multipart"
        )
        force_authenticate(request, user=self.artist)
        return CollectionListCreateView.as_view()(request)

    def test_create_passes_through_draft_true(self):
        response = self._create(
            {"title": fake.word(), "type": "album", "description": "x", "draft": "true"}
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Collection.objects.get(uuid=response.data["uuid"]).draft)

    def test_create_defaults_draft_to_false_when_omitted(self):
        response = self._create(
            {"title": fake.word(), "type": "playlist", "description": "x"}
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertFalse(Collection.objects.get(uuid=response.data["uuid"]).draft)


class TestCollectionPublishViaPatch(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        self.author = ArtistFactory()
        self.outsider = BaseUserFactory()

    def _draft_album(self, songs):
        album = CollectionFactory(type="album", draft=True, songs=songs)
        CollectionCredit.objects.create(collection=album, author=self.author)
        return album

    def _patch(self, album, user, payload):
        url = reverse("api:collection-detail", kwargs={"uuid": album.uuid})
        request = self.factory.patch(url, payload, format="multipart")
        force_authenticate(request, user=user)
        return CollectionRetrieveUpdateView.as_view()(request, uuid=album.uuid)

    def test_publish_succeeds_when_all_songs_processed(self):
        songs = BaseSongFactory.create_batch(2, draft=False)
        album = self._draft_album(songs)

        with patch("streaming.api.v1.views.collections.send_ws_event") as mock_ws:
            response = self._patch(album, self.author, {"draft": "false"})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        album.refresh_from_db()
        self.assertFalse(album.draft)
        mock_ws.assert_called_once()

    def test_publish_rejected_when_song_still_processing(self):
        songs = [
            BaseSongFactory(draft=False),
            BaseSongFactory(draft=True),
        ]
        album = self._draft_album(songs)

        response = self._patch(album, self.author, {"draft": "false"})

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("songs", response.data["errors"])
        self.assertEqual(len(response.data["errors"]["songs"]), 1)
        album.refresh_from_db()
        self.assertTrue(album.draft)

    def test_non_author_cannot_patch(self):
        songs = BaseSongFactory.create_batch(1, draft=False)
        album = self._draft_album(songs)

        response = self._patch(album, self.outsider, {"draft": "false"})

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        album.refresh_from_db()
        self.assertTrue(album.draft)

    def test_patch_other_fields_does_not_trigger_publish_check(self):
        songs = [BaseSongFactory(draft=True)]
        album = self._draft_album(songs)

        response = self._patch(album, self.author, {"title": "renamed while draft"})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        album.refresh_from_db()
        self.assertEqual(album.title, "renamed while draft")
        self.assertTrue(album.draft)


class TestDraftVisibility(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        self.author = ArtistFactory()
        self.outsider = BaseUserFactory()

    def _make_draft_album(self):
        album = CollectionFactory(type="album", draft=True, private=False, songs=[])
        CollectionCredit.objects.create(collection=album, author=self.author)
        return album

    def test_list_excludes_drafts(self):
        draft = self._make_draft_album()
        published = CollectionFactory(
            type="album", draft=False, private=False, songs=[]
        )

        url = reverse("api:collection-list-create")
        request = self.factory.get(url)
        force_authenticate(request, user=self.outsider)
        response = CollectionListCreateView.as_view()(request)

        uuids = {item["uuid"] for item in response.data["results"]}
        self.assertIn(str(published.uuid), uuids)
        self.assertNotIn(str(draft.uuid), uuids)

    def test_detail_blocks_non_author_on_draft(self):
        album = self._make_draft_album()

        url = reverse("api:collection-detail", kwargs={"uuid": album.uuid})
        request = self.factory.get(url)
        force_authenticate(request, user=self.outsider)
        response = CollectionRetrieveUpdateView.as_view()(request, uuid=album.uuid)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_detail_blocks_author_on_draft(self):
        album = self._make_draft_album()

        url = reverse("api:collection-detail", kwargs={"uuid": album.uuid})
        request = self.factory.get(url)
        force_authenticate(request, user=self.author)
        response = CollectionRetrieveUpdateView.as_view()(request, uuid=album.uuid)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_personal_excludes_authors_drafts(self):
        draft = self._make_draft_album()
        published = CollectionFactory(
            type="album", draft=False, private=False, songs=[]
        )
        CollectionCredit.objects.create(collection=published, author=self.author)

        url = reverse("api:collection-user-list", kwargs={"uuid": self.author.uuid})
        request = self.factory.get(url)
        force_authenticate(request, user=self.author)
        response = CollectionPersonalView.as_view()(request, uuid=self.author.uuid)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        created_uuids = {c["uuid"] for c in response.data["created_collections"]}
        self.assertIn(str(published.uuid), created_uuids)
        self.assertNotIn(str(draft.uuid), created_uuids)

    def test_album_by_song_404_for_draft(self):
        song = BaseSongFactory()
        album = self._make_draft_album()
        cs = CollectionSong.objects.create(collection=album, song=song)

        url = reverse("api:album-by-song", kwargs={"uuid": cs.uuid})

        for user in (self.author, self.outsider):
            request = self.factory.get(url)
            force_authenticate(request, user=user)
            response = AlbumBySongView.as_view()(request, uuid=cs.uuid)
            self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    @patch("streaming.api.v1.views.collections.validate_audio")
    @patch("streaming.api.v1.views.collections.convert_audio.apply_async")
    def test_author_can_upload_song_to_draft(self, mock_convert, mock_validate):
        mock_validate.return_value = AudioStreamInfo(
            duration_seconds=180.0,
            sample_rate=44100,
            channels=2,
            codec_name="mp3",
            bit_depth=None,
            bit_rate=320000,
        )
        mock_convert.return_value = MagicMock(id="task-id-456")
        album = self._make_draft_album()

        audio_file = io.BytesIO(b"fake audio content")
        audio_file.name = "test_song.mp3"
        payload = {
            "title": fake.word(),
            "description": fake.text(max_nb_chars=100),
            "audio": audio_file,
            "authors": [str(self.author.uuid)],
            "operation_id": "op-test-123",
        }

        url = reverse(
            "api:collection-song-create",
            kwargs={"collection_uuid": album.uuid},
        )
        request = self.factory.post(url, payload, format="multipart")
        force_authenticate(request, user=self.author)
        response = CollectionSongCreateView.as_view()(
            request, collection_uuid=album.uuid
        )

        self.assertEqual(response.status_code, status.HTTP_202_ACCEPTED)
        self.assertTrue(
            CollectionSong.objects.filter(
                collection=album, song__uuid=response.data["song_uuid"]
            ).exists()
        )
