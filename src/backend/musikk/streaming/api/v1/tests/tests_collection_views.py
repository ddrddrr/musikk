import io
import os
import shutil
import tempfile
import uuid
from unittest.mock import patch

from django.test import TestCase, override_settings
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
    CollectionRemoveSongView,
    CollectionRetrieveUpdateView,
    CollectionRetrieveView,
    CollectionSongListCreateView,
    UserLibraryView,
)
from streaming.audio.probes import AudioStreamInfo
from streaming.audio.upload_files import (
    create_upload_dirs,
    find_source_file,
    incoming_dir,
    songs_dir,
)
from streaming.models import Collection
from streaming.models.collections import CollectionCredit, CollectionType
from streaming.models.songs import BaseSong, CollectionSong, SongStatus
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
        self.songs = BaseSongFactory.create_batch(3)

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
            self.artist.streamingprofile.liked_collections.filter(
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
                "collection_song_uuid": collection_song.uuid,
            },
        )
        request = self.factory.delete(url)
        force_authenticate(request, user=self.artist)
        response = CollectionRemoveSongView.as_view()(
            request,
            collection_uuid=collection.uuid,
            collection_song_uuid=collection_song.uuid,
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
                "collection_song_uuid": collection_song.uuid,
            },
        )
        request = self.factory.delete(url)
        force_authenticate(request, user=self.artist)
        response = CollectionRemoveSongView.as_view()(
            request,
            collection_uuid=collection.uuid,
            collection_song_uuid=collection_song.uuid,
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


class TestCollectionSongListCreateView(TestCase):
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
            "api:collection-song-list-create",
            kwargs={"collection_uuid": target_collection.uuid},
        )
        request = self.factory.post(url, {"song_uuid": str(song.uuid)}, format="json")
        force_authenticate(request, user=self.artist)
        response = CollectionSongListCreateView.as_view()(
            request, collection_uuid=target_collection.uuid
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["song_uuid"], str(song.uuid))
        self.assertTrue(
            CollectionSong.objects.filter(
                collection=target_collection, song=song
            ).exists()
        )


def _audio_info() -> AudioStreamInfo:
    return AudioStreamInfo(
        duration_seconds=180.0,
        sample_rate=44100,
        channels=2,
        codec_name="mp3",
        bit_depth=None,
        bit_rate=320000,
    )


class UploadTmpDirMixin:
    """Points the upload folders at a fresh temp dir, so tests can check what is left."""

    def setUp(self):
        super().setUp()
        self.upload_tmp = tempfile.mkdtemp()
        self.upload_override = override_settings(
            UPLOAD_TMP_DIR=self.upload_tmp,
            FILE_UPLOAD_TEMP_DIR=os.path.join(self.upload_tmp, "incoming"),
        )
        self.upload_override.enable()
        create_upload_dirs()

    def tearDown(self):
        self.upload_override.disable()
        shutil.rmtree(self.upload_tmp, ignore_errors=True)
        super().tearDown()

    def assert_no_upload_files_left(self):
        self.assertEqual(list(songs_dir().iterdir()), [])
        self.assertEqual(list(incoming_dir().iterdir()), [])


@patch("streaming.api.v1.views.collections.validate_audio", return_value=_audio_info())
@patch("streaming.audio.tasks.convert_audio.apply_async")
class TestAlbumTrackUpload(UploadTmpDirMixin, TestCase):
    def setUp(self):
        super().setUp()
        self.factory = APIRequestFactory()
        self.artist = ArtistFactory()
        self.album = CollectionFactory(type="album", draft=True, songs__songs_count=0)
        CollectionCredit.objects.create(collection=self.album, author=self.artist)

    def _payload(self, **overrides):
        audio_file = io.BytesIO(b"fake audio content")
        audio_file.name = "test_song.mp3"
        payload = {
            "title": fake.word(),
            "description": fake.text(max_nb_chars=100),
            "audio": audio_file,
            "authors": [str(self.artist.uuid)],
            "operation_id": str(uuid.uuid4()),
            "position": 0,
        }
        payload.update(overrides)
        return payload

    def _upload(self, payload):
        url = reverse(
            "api:collection-song-list-create",
            kwargs={"collection_uuid": self.album.uuid},
        )
        request = self.factory.post(url, payload, format="multipart")
        force_authenticate(request, user=self.artist)
        with self.captureOnCommitCallbacks(execute=True):
            response = CollectionSongListCreateView.as_view()(
                request, collection_uuid=self.album.uuid
            )
        request.close()
        return response

    def test_upload_creates_queued_song_and_enqueues_once(
        self, mock_convert, mock_validate
    ):
        response = self._upload(self._payload())

        self.assertEqual(response.status_code, status.HTTP_202_ACCEPTED)
        self.assertEqual(response.data["status"], SongStatus.QUEUED)
        song = BaseSong.objects.get(uuid=response.data["song_uuid"])
        self.assertEqual(song.status, SongStatus.QUEUED)
        mock_convert.assert_called_once()
        self.assertEqual(
            mock_convert.call_args.kwargs["kwargs"]["song_uuid"], str(song.uuid)
        )
        source = find_source_file(song.uuid)
        self.assertIsNotNone(source)
        self.assertEqual(source.suffix, ".mp3")

    def test_upload_to_published_album_returns_400(self, mock_convert, mock_validate):
        Collection.objects.filter(pk=self.album.pk).update(draft=False)

        response = self._upload(self._payload())

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(BaseSong.objects.exists())
        mock_validate.assert_not_called()
        self.assert_no_upload_files_left()

    def test_upload_with_multiple_authors(self, mock_convert, mock_validate):
        other_artist = ArtistFactory()
        payload = self._payload(authors=[str(self.artist.uuid), str(other_artist.uuid)])

        response = self._upload(payload)

        self.assertEqual(response.status_code, status.HTTP_202_ACCEPTED)
        song = BaseSong.objects.get(uuid=response.data["song_uuid"])
        self.assertEqual(song.credits.count(), 2)

    def test_same_operation_id_twice_returns_same_row_and_enqueues_once(
        self, mock_convert, mock_validate
    ):
        operation_id = str(uuid.uuid4())

        first = self._upload(self._payload(operation_id=operation_id))
        second = self._upload(self._payload(operation_id=operation_id))

        self.assertEqual(first.status_code, status.HTTP_202_ACCEPTED)
        self.assertEqual(second.status_code, status.HTTP_200_OK)
        self.assertEqual(
            first.data["collection_song_uuid"], second.data["collection_song_uuid"]
        )
        self.assertEqual(
            CollectionSong.objects.filter(collection=self.album).count(), 1
        )
        mock_convert.assert_called_once()
        self.assertEqual(len(list(songs_dir().iterdir())), 1)
        self.assertEqual(list(incoming_dir().iterdir()), [])

    def test_given_position_is_stored(self, mock_convert, mock_validate):
        response = self._upload(self._payload(position=5))

        self.assertEqual(response.status_code, status.HTTP_202_ACCEPTED)
        collection_song = CollectionSong.objects.get(
            uuid=response.data["collection_song_uuid"]
        )
        self.assertEqual(collection_song.position, 5)

    def test_invalid_operation_id_or_position_returns_400(
        self, mock_convert, mock_validate
    ):
        for overrides in (
            {"operation_id": "op-test-123"},
            {"position": -1},
            {"position": "first"},
        ):
            with self.subTest(**overrides):
                response = self._upload(self._payload(**overrides))
                self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        mock_validate.assert_not_called()
        self.assert_no_upload_files_left()

    def test_audio_sent_as_text_returns_400(self, mock_convert, mock_validate):
        response = self._upload(self._payload(audio="not a file"))

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_serializer_error_leaves_no_files(self, mock_convert, mock_validate):
        payload = self._payload()
        del payload["title"]

        response = self._upload(payload)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(BaseSong.objects.exists())
        mock_validate.assert_not_called()
        self.assert_no_upload_files_left()

    def test_audio_validation_error_leaves_no_files(self, mock_convert, mock_validate):
        mock_validate.side_effect = ValidationError("Invalid audio format")

        response = self._upload(self._payload())

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(BaseSong.objects.exists())
        mock_convert.assert_not_called()
        self.assert_no_upload_files_left()

    def test_parallel_request_with_same_key_returns_the_winner(
        self, mock_convert, mock_validate
    ):
        operation_id = uuid.uuid4()
        winner = CollectionSong.objects.create(
            collection=self.album,
            song=BaseSongFactory(status=SongStatus.QUEUED),
            operation_id=operation_id,
            position=0,
        )

        with patch(
            "streaming.api.v1.views.collections._find_album_song",
            side_effect=[None, winner],
        ):
            response = self._upload(self._payload(operation_id=str(operation_id)))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["collection_song_uuid"], str(winner.uuid))
        self.assertEqual(BaseSong.objects.count(), 1)
        mock_convert.assert_not_called()
        self.assert_no_upload_files_left()

    def test_enqueue_error_marks_song_failed(self, mock_convert, mock_validate):
        mock_convert.side_effect = ConnectionError("broker is down")

        response = self._upload(self._payload())

        self.assertEqual(response.status_code, status.HTTP_202_ACCEPTED)
        song = BaseSong.objects.get(uuid=response.data["song_uuid"])
        self.assertEqual(song.status, SongStatus.FAILED)
        self.assertNotEqual(song.status_detail, "")
        self.assert_no_upload_files_left()


class TestAlbumTrackList(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        self.author = ArtistFactory()
        self.outsider = ArtistFactory()

    def _get(self, collection, user):
        url = reverse(
            "api:collection-song-list-create",
            kwargs={"collection_uuid": collection.uuid},
        )
        request = self.factory.get(url)
        force_authenticate(request, user=user)
        return CollectionSongListCreateView.as_view()(
            request, collection_uuid=collection.uuid
        )

    def test_author_sees_every_track_in_position_order(self):
        album = CollectionFactory(type="album", draft=True, songs__songs_count=0)
        CollectionCredit.objects.create(collection=album, author=self.author)
        statuses = [SongStatus.FAILED, SongStatus.READY, SongStatus.QUEUED]
        for position, song_status in reversed(list(enumerate(statuses))):
            CollectionSong.objects.create(
                collection=album,
                song=BaseSongFactory(status=song_status),
                position=position,
                operation_id=uuid.uuid4(),
            )

        response = self._get(album, self.author)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual([t["position"] for t in response.data], [0, 1, 2])
        self.assertEqual([t["status"] for t in response.data], statuses)
        self.assertEqual(
            set(response.data[0]),
            {
                "collection_song_uuid",
                "song_uuid",
                "title",
                "position",
                "status",
                "status_detail",
                "operation_id",
            },
        )

    def test_non_author_gets_403(self):
        album = CollectionFactory(type="album", draft=True, songs=[])
        CollectionCredit.objects.create(collection=album, author=self.author)

        response = self._get(album, self.outsider)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_playlist_gets_404(self):
        playlist = CollectionFactory(type="playlist", songs=[])
        CollectionCredit.objects.create(collection=playlist, author=self.author)

        response = self._get(playlist, self.author)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class TestRemoveAlbumTrack(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        self.author = ArtistFactory()

    def _collection(self, **kwargs):
        collection = CollectionFactory(songs__songs_count=0, **kwargs)
        CollectionCredit.objects.create(collection=collection, author=self.author)
        return collection

    def _remove(self, collection_song):
        kwargs = {
            "collection_uuid": collection_song.collection.uuid,
            "collection_song_uuid": collection_song.uuid,
        }
        url = reverse("api:collection-remove-song", kwargs=kwargs)
        request = self.factory.delete(url)
        force_authenticate(request, user=self.author)
        with self.captureOnCommitCallbacks(execute=True):
            return CollectionRemoveSongView.as_view()(request, **kwargs)

    @patch("streaming.models.songs.delete_django_storage_dir")
    def test_draft_album_track_removes_song_and_its_files(self, mock_delete_storage):
        album = self._collection(type="album", draft=True)
        song = BaseSongFactory(content_path="audio/some-song")
        collection_song = CollectionSong.objects.create(collection=album, song=song)

        response = self._remove(collection_song)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(BaseSong.objects.filter(uuid=song.uuid).exists())
        self.assertFalse(
            CollectionSong.objects.filter(uuid=collection_song.uuid).exists()
        )
        mock_delete_storage.assert_called_once_with("audio/some-song")

    @patch("streaming.models.songs.delete_django_storage_dir")
    def test_playlist_entry_removes_only_the_link(self, mock_delete_storage):
        playlist = self._collection(type="playlist")
        song = BaseSongFactory(content_path="audio/other-artist-song")
        collection_song = CollectionSong.objects.create(collection=playlist, song=song)

        response = self._remove(collection_song)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(BaseSong.objects.filter(uuid=song.uuid).exists())
        self.assertFalse(
            CollectionSong.objects.filter(uuid=collection_song.uuid).exists()
        )
        mock_delete_storage.assert_not_called()

    def test_published_album_track_keeps_the_song(self):
        album = self._collection(type="album", draft=False)
        song = BaseSongFactory()
        collection_song = CollectionSong.objects.create(collection=album, song=song)

        self._remove(collection_song)

        self.assertTrue(BaseSong.objects.filter(uuid=song.uuid).exists())


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
        songs = BaseSongFactory.create_batch(2)
        album = self._draft_album(songs)

        with patch("streaming.api.v1.views.collections.send_ws_event") as mock_ws:
            response = self._patch(album, self.author, {"draft": "false"})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        album.refresh_from_db()
        self.assertFalse(album.draft)
        mock_ws.assert_called_once()

    def test_publish_rejected_when_song_still_processing(self):
        songs = [
            BaseSongFactory(),
            BaseSongFactory(status=SongStatus.PROCESSING),
        ]
        album = self._draft_album(songs)

        response = self._patch(album, self.author, {"draft": "false"})

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("songs", response.data["errors"])
        self.assertEqual(len(response.data["errors"]["songs"]), 1)
        album.refresh_from_db()
        self.assertTrue(album.draft)

    def test_non_author_cannot_patch(self):
        songs = BaseSongFactory.create_batch(1)
        album = self._draft_album(songs)

        response = self._patch(album, self.outsider, {"draft": "false"})

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        album.refresh_from_db()
        self.assertTrue(album.draft)

    def test_patch_other_fields_does_not_trigger_publish_check(self):
        songs = [BaseSongFactory(status=SongStatus.PROCESSING)]
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

    def test_library_excludes_authors_drafts(self):
        draft = self._make_draft_album()
        published = CollectionFactory(
            type="album", draft=False, private=False, songs=[]
        )
        CollectionCredit.objects.create(collection=published, author=self.author)

        url = reverse("api:user-library", kwargs={"uuid": self.author.uuid})
        request = self.factory.get(url)
        force_authenticate(request, user=self.author)
        response = UserLibraryView.as_view()(request, uuid=self.author.uuid)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        created_uuids = {c["uuid"] for c in response.data["created_collections"]}
        self.assertIn(str(published.uuid), created_uuids)
        self.assertNotIn(str(draft.uuid), created_uuids)

    def test_album_by_song_404_for_draft(self):
        song = BaseSongFactory()
        album = self._make_draft_album()
        CollectionSong.objects.create(collection=album, song=song)

        url = reverse("api:album-by-song", kwargs={"song_uuid": song.uuid})

        for user in (self.author, self.outsider):
            request = self.factory.get(url)
            force_authenticate(request, user=user)
            response = AlbumBySongView.as_view()(request, song_uuid=song.uuid)
            self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class TestAlbumBySongView(TestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.factory = APIRequestFactory()
        cls.user = BaseUserFactory()

    def test_finds_album_by_base_song_uuid(self):
        song = BaseSongFactory()
        album = CollectionFactory(type="album", draft=False, private=False, songs=[])
        CollectionSong.objects.create(collection=album, song=song)
        playlist = CollectionFactory(type="playlist", private=False, songs=[])
        CollectionSong.objects.create(collection=playlist, song=song)

        url = reverse("api:album-by-song", kwargs={"song_uuid": song.uuid})
        request = self.factory.get(url)
        force_authenticate(request, user=self.user)
        response = AlbumBySongView.as_view()(request, song_uuid=song.uuid)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["uuid"], str(album.uuid))

    def test_404_for_unknown_song(self):
        song_uuid = uuid.uuid4()
        url = reverse("api:album-by-song", kwargs={"song_uuid": song_uuid})
        request = self.factory.get(url)
        force_authenticate(request, user=self.user)
        response = AlbumBySongView.as_view()(request, song_uuid=song_uuid)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
