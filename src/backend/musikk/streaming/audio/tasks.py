import dataclasses
import logging
import os
import subprocess
import time
from uuid import UUID

from celery import shared_task
from celery.exceptions import SoftTimeLimitExceeded
from django.conf import settings
from django.utils import timezone
from utils.storage import delete_django_storage_dir
from websockets.event_helpers import send_ws_event, user_group

from streaming.audio.exceptions import (
    AudioProcessingPipelineError,
    ProcessingTimeoutError,
)
from streaming.audio.probes import AudioStreamInfo
from streaming.audio.processing_pipeline import AudioProcessingPipeline
from streaming.audio.shaka_packager_conf.shaka_packager_wrapper import ManifestType
from streaming.audio.upload_cleanup import run_upload_cleanup
from streaming.audio.upload_files import (
    delete_track_dir,
    find_source_file,
    track_work_dir,
)
from streaming.models.songs import BaseSong, SongStatus
from streaming.ws.events import ServerEvent

logger = logging.getLogger(__name__)

SOFT_TIME_LIMIT_SECONDS = 30 * 60  # 30min, just a reasonable number, not tested


@shared_task(
    acks_on_failure_or_timeout=True,
    soft_time_limit=SOFT_TIME_LIMIT_SECONDS,
    # one more minute for the cleanup after the soft limit
    time_limit=SOFT_TIME_LIMIT_SECONDS + 60,
)
def convert_audio(
    song_uuid: str | UUID, initiator_uuid: str | UUID, audio_info: dict
) -> None:
    """Turns the uploaded song into the streamable files."""
    # the soft limit can't stop the FFmpeg threads, so they get an earlier deadline
    deadline = time.monotonic() + SOFT_TIME_LIMIT_SECONDS - 30

    if not _mark_song_as_processing_if_queued(song_uuid):
        logger.info(f"Song {song_uuid} was not found or queued, skipping processing")
        if not BaseSong.objects.filter(
            uuid=song_uuid, status=SongStatus.PROCESSING
        ).exists():
            delete_track_dir(song_uuid)
        return

    try:
        _send_upload_ws_event(initiator_uuid, song_uuid, SongStatus.PROCESSING)
        _run_song_processing_pipeline(
            song_uuid, initiator_uuid, AudioStreamInfo(**audio_info), deadline
        )
    finally:
        delete_track_dir(song_uuid)


def _mark_song_as_processing_if_queued(song_uuid: str | UUID) -> bool:
    songs_updated = BaseSong.objects.filter(
        uuid=song_uuid, status=SongStatus.QUEUED
    ).update(status=SongStatus.PROCESSING, date_modified=timezone.now())
    return songs_updated == 1


def _run_song_processing_pipeline(
    song_uuid: str | UUID,
    initiator_uuid: str | UUID,
    info: AudioStreamInfo,
    deadline: float,
) -> None:
    final_dir = os.path.join(settings.AUDIO_CONTENT_PATH, str(song_uuid))

    try:
        source = find_source_file(song_uuid)
        if source is None:
            raise AudioProcessingPipelineError(f"No source file for song {song_uuid}")

        result = AudioProcessingPipeline.run(
            source=source,
            final_storage_dir=final_dir,
            audio_info=info,
            work_dir=track_work_dir(song_uuid),
            deadline=deadline,
        )
        song_repr = result.song_repr
        saved = BaseSong.objects.filter(
            uuid=song_uuid, status=SongStatus.PROCESSING
        ).update(
            status=SongStatus.READY,
            status_detail="",
            content_path=song_repr.content_path,
            mpd=song_repr.manifests[ManifestType.MPD],
            m3u8=song_repr.manifests[ManifestType.M3U8],
            duration_ms=int(info.duration_seconds * 1000),
            source_codec=info.codec_name,
            source_bitrate=info.bit_rate,
            loudness_lufs=result.loudness_lufs,
            true_peak_dbtp=result.true_peak_dbtp,
            date_modified=timezone.now(),
        )
    except Exception as exc:
        logger.exception(f"Audio processing failed for song {song_uuid}")
        delete_django_storage_dir(final_dir)
        BaseSong.objects.filter(uuid=song_uuid, status=SongStatus.PROCESSING).update(
            status=SongStatus.FAILED,
            status_detail=_failure_detail(exc),
            date_modified=timezone.now(),
        )
        _send_upload_ws_event(initiator_uuid, song_uuid, SongStatus.FAILED)
        return

    if not saved:
        logger.info(f"Song {song_uuid} was removed during processing")
        delete_django_storage_dir(final_dir)
        return

    _send_upload_ws_event(initiator_uuid, song_uuid, SongStatus.READY)


def _failure_detail(exc: Exception) -> str:
    timeouts = (
        SoftTimeLimitExceeded,
        subprocess.TimeoutExpired,
        ProcessingTimeoutError,
    )
    if isinstance(exc, timeouts):
        return "Song processing timeout"
    return "Audio processing failed"


def _send_upload_ws_event(
    initiator_uuid: str | UUID, song_uuid: str | UUID, status: SongStatus
) -> None:
    """
    The event only tells the client to read the song rows again, and the
    client also polls them. So a failed send is logged and changes nothing.
    """
    try:
        send_ws_event(
            user_group(initiator_uuid),
            event_name=ServerEvent.SONG_UPLOAD,
            uuid=str(song_uuid),
            status=status.value,
        )
    except Exception:
        logger.exception(f"Failed to send the upload event for song {song_uuid}")


def create_song_conversion_task(
    song_uuid: UUID, initiator_uuid: UUID, audio_info: AudioStreamInfo
) -> None:
    try:
        convert_audio.apply_async(
            kwargs={
                "song_uuid": str(song_uuid),
                "initiator_uuid": str(initiator_uuid),
                "audio_info": dataclasses.asdict(audio_info),
            }
        )
    except Exception:
        logger.exception(f"Failed to enqueue the conversion of song {song_uuid}")
        BaseSong.objects.filter(uuid=song_uuid, status=SongStatus.QUEUED).update(
            status=SongStatus.FAILED,
            status_detail="Could not start audio processing",
            date_modified=timezone.now(),
        )
        delete_track_dir(song_uuid)


@shared_task
def cleanup_uploads() -> None:
    run_upload_cleanup()
