import logging
import os
import shutil
from collections.abc import Iterable
from datetime import datetime, timedelta
from uuid import UUID

from django.conf import settings
from django.core.files.storage import default_storage
from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from utils.storage import delete_django_storage_dir

from streaming.audio.config import CONVERSION_TIME_LIMIT_SECONDS
from streaming.audio.upload_files import incoming_dir, songs_dir
from streaming.models.collections import Collection, CollectionType
from streaming.models.songs import BaseSong, SongStatus

logger = logging.getLogger(__name__)


def run_upload_cleanup() -> None:
    """
    Repairs everything a crashed request or a killed task can leave behind.
    The song rows are the source of truth, so the rows are fixed first, and
    the files are then deleted based on the rows.
    """
    now = timezone.now()
    fail_stuck_songs(now)
    delete_old_draft_albums(now)
    delete_unneeded_audio_pipeline_dirs(now)
    delete_orphaned_processed_audio_dirs(now)
    delete_old_incoming_files(now)


# conversion time limit + small margin
STUCK_PROCESSING_AFTER = timedelta(seconds=CONVERSION_TIME_LIMIT_SECONDS, minutes=5)
# an album can be in the queue for a long time, but not sure how much, probably has to be adjusted later
STUCK_QUEUED_AFTER = timedelta(days=1)


def fail_stuck_songs(now: datetime) -> None:
    """
    A "stuck" song is a song that is too long in the processing or queued state.
    """
    stuck = Q(
        status=SongStatus.PROCESSING, date_modified__lt=now - STUCK_PROCESSING_AFTER
    ) | Q(status=SongStatus.QUEUED, date_modified__lt=now - STUCK_QUEUED_AFTER)

    for song_uuid in BaseSong.objects.filter(stuck).values_list("uuid", flat=True):
        updated = BaseSong.objects.filter(stuck, uuid=song_uuid).update(
            status=SongStatus.FAILED,
            status_detail="Processing did not finish.",
            date_modified=now,
        )
        if updated:
            logger.info(f"Marked stuck song {song_uuid} as failed")
            delete_django_storage_dir(
                os.path.join(settings.AUDIO_CONTENT_PATH, str(song_uuid))
            )


DRAFT_ALBUM_MAX_AGE = timedelta(days=1)


def delete_old_draft_albums(now: datetime) -> None:
    drafts = Collection.objects.filter(
        type=CollectionType.ALBUM,
        draft=True,
        date_added__lt=now - DRAFT_ALBUM_MAX_AGE,
    )
    for collection in drafts:
        logger.info(f"Deleting draft album {collection.uuid} ({collection.title!r})")
        with transaction.atomic():
            songs = BaseSong.objects.filter(
                collectionsongs__collection=collection
            ).distinct()
            for song in songs:
                song.delete()
            collection.delete()


# the upload view creates the track folder a few seconds before the song
TRACK_DIR_MIN_AGE = timedelta(hours=1)


def delete_unneeded_audio_pipeline_dirs(now: datetime) -> None:
    min_mtime = (now - TRACK_DIR_MIN_AGE).timestamp()
    candidates = {
        folder.name: folder
        for folder in songs_dir().iterdir()
        if folder.is_dir() and folder.stat().st_mtime < min_mtime
    }
    active = {
        str(song_uuid)
        for song_uuid in BaseSong.objects.filter(
            uuid__in=_valid_uuids(candidates),
            status__in=(SongStatus.QUEUED, SongStatus.PROCESSING),
        ).values_list("uuid", flat=True)
    }
    for name, folder in candidates.items():
        if name not in active:
            logger.info(f"Deleting orphan track folder {folder}")
            shutil.rmtree(folder, ignore_errors=True)


# the conversion and the seeder write the packaged audio before they save `content_path`
SONG_CONTENT_DIR_MIN_AGE = timedelta(hours=1)


def delete_orphaned_processed_audio_dirs(now: datetime) -> None:
    """
    Deletes the packaged audio folders that no song refers to.
    `BaseSong.delete()` removes the folder of its song, but a queryset
    delete, for example the "Delete selected" admin action, does not call
    it. The folders are matched by `content_path` and not by the song
    uuid, because the seeder gives them random names.
    """
    content_root = settings.AUDIO_CONTENT_PATH
    if not default_storage.exists(content_root):
        return
    max_modified_time = now - SONG_CONTENT_DIR_MIN_AGE
    referenced = set(BaseSong.objects.values_list("content_path", flat=True))
    folders, _ = default_storage.listdir(content_root)
    for name in folders:
        folder = os.path.join(content_root, name)
        if folder in referenced:
            continue
        if default_storage.get_modified_time(folder) < max_modified_time:
            logger.info(f"Deleting orphan song content folder {folder}")
            delete_django_storage_dir(folder)


INCOMING_FILE_MAX_AGE = timedelta(days=1)


def delete_old_incoming_files(now: datetime) -> None:
    """
    Django deletes its upload files at the end of each request. A file
    that is still here a day later was left by a crashed process.
    """
    min_mtime = (now - INCOMING_FILE_MAX_AGE).timestamp()
    for entry in incoming_dir().iterdir():
        try:
            if entry.is_file() and entry.stat().st_mtime < min_mtime:
                entry.unlink()
                logger.info(f"Deleted old upload file {entry}")
        except OSError:
            logger.exception(f"Failed to delete old upload file {entry}")


def _valid_uuids(names: Iterable[str]) -> list[UUID]:
    valid = []
    for name in names:
        try:
            valid.append(UUID(name))
        except ValueError:
            continue
    return valid
