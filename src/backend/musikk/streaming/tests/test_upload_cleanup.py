import os
import shutil
import tempfile
import uuid
from datetime import timedelta
from pathlib import Path
from unittest.mock import patch

from django.conf import settings
from django.test import TestCase, override_settings
from django.utils import timezone
from utils.storage import delete_django_storage_dir

from streaming.audio.upload_cleanup import (
    STUCK_PROCESSING_AFTER,
    STUCK_QUEUED_AFTER,
    run_upload_cleanup,
)
from streaming.audio.upload_files import create_upload_dirs, incoming_dir, track_dir
from streaming.models import BaseSong, Collection
from streaming.models.collections import CollectionType
from streaming.models.songs import SongStatus
from streaming.tests.factories import BaseSongFactory, CollectionFactory


def _set_age(path: Path, age: timedelta) -> None:
    timestamp = (timezone.now() - age).timestamp()
    os.utime(path, (timestamp, timestamp))


@patch("streaming.audio.upload_cleanup.delete_django_storage_dir")
class UploadCleanupTest(TestCase):
    def setUp(self):
        self.upload_tmp = tempfile.mkdtemp()
        # the cleanup lists the song content folders, which must not be the real ones
        self.media_root = tempfile.mkdtemp()
        self.override = override_settings(
            UPLOAD_TMP_DIR=self.upload_tmp,
            FILE_UPLOAD_TEMP_DIR=os.path.join(self.upload_tmp, "incoming"),
            MEDIA_ROOT=self.media_root,
        )
        self.override.enable()
        create_upload_dirs()

    def tearDown(self):
        self.override.disable()
        shutil.rmtree(self.upload_tmp, ignore_errors=True)
        shutil.rmtree(self.media_root, ignore_errors=True)

    def _song(self, status: SongStatus, age: timedelta = timedelta()) -> BaseSong:
        song = BaseSongFactory(status=status)
        BaseSong.objects.filter(uuid=song.uuid).update(
            date_modified=timezone.now() - age
        )
        return song

    def _track_dir(self, song_uuid, age: timedelta = timedelta(hours=2)) -> Path:
        folder = track_dir(song_uuid)
        folder.mkdir(parents=True)
        (folder / "source.wav").write_bytes(b"audio")
        _set_age(folder, age)
        return folder

    def _status(self, song: BaseSong) -> str:
        song.refresh_from_db()
        return song.status

    def test_stuck_processing_song_becomes_failed(self, mock_delete_storage):
        stuck = self._song(
            SongStatus.PROCESSING, STUCK_PROCESSING_AFTER + timedelta(minutes=1)
        )
        running = self._song(SongStatus.PROCESSING, timedelta(minutes=5))

        run_upload_cleanup()

        self.assertEqual(self._status(stuck), SongStatus.FAILED)
        self.assertEqual(self._status(running), SongStatus.PROCESSING)
        mock_delete_storage.assert_called_once()
        self.assertIn(str(stuck.uuid), mock_delete_storage.call_args.args[0])

    def test_old_queued_song_becomes_failed(self, mock_delete_storage):
        lost = self._song(SongStatus.QUEUED, STUCK_QUEUED_AFTER + timedelta(hours=1))
        waiting = self._song(SongStatus.QUEUED, timedelta(hours=2))

        run_upload_cleanup()

        self.assertEqual(self._status(lost), SongStatus.FAILED)
        self.assertEqual(self._status(waiting), SongStatus.QUEUED)

    def test_orphan_track_folders_are_deleted(self, mock_delete_storage):
        gone = self._track_dir(uuid.uuid4())
        failed = self._track_dir(self._song(SongStatus.FAILED).uuid)
        ready = self._track_dir(self._song(SongStatus.READY).uuid)
        queued = self._track_dir(self._song(SongStatus.QUEUED).uuid)
        processing = self._track_dir(self._song(SongStatus.PROCESSING).uuid)
        just_moved = self._track_dir(uuid.uuid4(), age=timedelta(seconds=10))

        run_upload_cleanup()

        for folder in (gone, failed, ready):
            self.assertFalse(folder.exists(), folder)
        for folder in (queued, processing, just_moved):
            self.assertTrue(folder.exists(), folder)

    def _content_dir(self, age: timedelta = timedelta(hours=2)) -> tuple[str, Path]:
        storage_dir = os.path.join(settings.AUDIO_CONTENT_PATH, str(uuid.uuid4()))
        folder = Path(self.media_root) / storage_dir
        folder.mkdir(parents=True)
        (folder / "manifest.mpd").write_bytes(b"manifest")
        _set_age(folder, age)
        return storage_dir, folder

    def test_orphan_song_content_folders_are_deleted(self, mock_delete_storage):
        mock_delete_storage.side_effect = delete_django_storage_dir
        song_dir, song_folder = self._content_dir()
        BaseSongFactory(status=SongStatus.READY, content_path=song_dir)
        _, orphan_folder = self._content_dir()
        _, young_orphan_folder = self._content_dir(age=timedelta(minutes=5))

        run_upload_cleanup()

        self.assertFalse(orphan_folder.exists())
        self.assertTrue(song_folder.exists())
        self.assertTrue(young_orphan_folder.exists())

    def test_old_incoming_files_are_deleted(self, mock_delete_storage):
        old = incoming_dir() / "old.upload"
        old.write_bytes(b"x")
        _set_age(old, timedelta(hours=25))
        fresh = incoming_dir() / "fresh.upload"
        fresh.write_bytes(b"x")

        run_upload_cleanup()

        self.assertFalse(old.exists())
        self.assertTrue(fresh.exists())

    def _draft_album(self, age: timedelta, songs_count: int = 2) -> Collection:
        album = CollectionFactory(
            type=CollectionType.ALBUM,
            draft=True,
            songs=BaseSongFactory.create_batch(songs_count),
        )
        Collection.objects.filter(pk=album.pk).update(date_added=timezone.now() - age)
        return album

    def test_old_draft_albums_are_deleted_with_their_songs(self, mock_delete_storage):
        old_draft = self._draft_album(timedelta(days=2))
        recent_draft = self._draft_album(timedelta(hours=2))
        published = CollectionFactory(type=CollectionType.ALBUM, draft=False)
        draft_playlist = CollectionFactory(type=CollectionType.PLAYLIST, draft=True)
        for collection in (published, draft_playlist):
            Collection.objects.filter(pk=collection.pk).update(
                date_added=timezone.now() - timedelta(days=10)
            )
        old_song_uuids = list(
            BaseSong.objects.filter(collectionsongs__collection=old_draft).values_list(
                "uuid", flat=True
            )
        )

        run_upload_cleanup()

        self.assertFalse(Collection.objects.filter(pk=old_draft.pk).exists())
        self.assertFalse(BaseSong.objects.filter(uuid__in=old_song_uuids).exists())
        for collection in (recent_draft, published, draft_playlist):
            self.assertTrue(Collection.objects.filter(pk=collection.pk).exists())
