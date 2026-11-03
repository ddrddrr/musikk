import logging
import os
import shutil
from collections.abc import Iterable
from datetime import datetime, timedelta
from uuid import UUID

from django.conf import settings
from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from utils.storage import delete_django_storage_dir

from streaming.audio.upload_files import incoming_dir, songs_dir
from streaming.models.collections import Collection, CollectionType
from streaming.models.songs import BaseSong, SongStatus

logger = logging.getLogger(__name__)

# longer than the conversion task's time limit, so a row still in `processing` after this is stuck
STUCK_PROCESSING_AFTER = timedelta(hours=1)
# high, because a big album can wait in the queue for a long time
STUCK_QUEUED_AFTER = timedelta(hours=24)
INCOMING_FILE_MAX_AGE = timedelta(hours=24)
DRAFT_ALBUM_MAX_AGE = timedelta(days=1)
# the upload view creates the track folder a few seconds before it commits the song row
TRACK_DIR_MIN_AGE = timedelta(hours=1)

STUCK_DETAIL = "Processing did not finish."
ACTIVE_STATUSES = (SongStatus.QUEUED, SongStatus.PROCESSING)


def run_upload_cleanup() -> None:
    """
    Repairs everything a crashed request or a killed task can leave behind.
    The song rows are the source of truth, so the rows are fixed first, and
    the files are then deleted based on the rows.
    """
    now = timezone.now()
    fail_stuck_songs(now)
    delete_old_draft_albums(now)
    delete_orphan_track_dirs(now)
    delete_old_incoming_files(now)


def fail_stuck_songs(now: datetime) -> None:
    """
    Each row is updated on its own, with the age condition in the UPDATE.
    A song that a task claims in the meantime gets a new `date_modified`,
    so it no longer matches and keeps its status.
    """
    stuck = Q(
        status=SongStatus.PROCESSING, date_modified__lt=now - STUCK_PROCESSING_AFTER
    ) | Q(status=SongStatus.QUEUED, date_modified__lt=now - STUCK_QUEUED_AFTER)

    for song_uuid in BaseSong.objects.filter(stuck).values_list("uuid", flat=True):
        updated = BaseSong.objects.filter(stuck, uuid=song_uuid).update(
            status=SongStatus.FAILED, status_detail=STUCK_DETAIL, date_modified=now
        )
        if updated:
            logger.info(f"Marked stuck song {song_uuid} as failed")
            delete_django_storage_dir(
                os.path.join(settings.AUDIO_CONTENT_PATH, str(song_uuid))
            )


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


def delete_orphan_track_dirs(now: datetime) -> None:
    """Deletes the track folders whose song is gone, `ready` or `failed`."""
    min_mtime = (now - TRACK_DIR_MIN_AGE).timestamp()
    candidates = {
        folder.name: folder
        for folder in songs_dir().iterdir()
        if folder.is_dir() and folder.stat().st_mtime < min_mtime
    }
    active = {
        str(song_uuid)
        for song_uuid in BaseSong.objects.filter(
            uuid__in=_valid_uuids(candidates), status__in=ACTIVE_STATUSES
        ).values_list("uuid", flat=True)
    }
    for name, folder in candidates.items():
        if name not in active:
            logger.info(f"Deleting orphan track folder {folder}")
            shutil.rmtree(folder, ignore_errors=True)


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
