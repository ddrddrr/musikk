import logging
import os
from pathlib import Path
from uuid import UUID

from celery import shared_task
from django.conf import settings
from django.db import transaction

from utils.storage import delete_django_storage_dir
from streaming.audio.processing_pipeline import AudioProcessingPipeline
from streaming.audio.shaka_packager_conf.shaka_packager_wrapper import ManifestType
from streaming.managers.upload_manager import UploadManager
from streaming.models.songs import BaseSong
from streaming.api.v1.ws_conf import ServerEvent
from websockets.event_helpers import send_ws_event, user_group

logger = logging.getLogger(__name__)


@shared_task(
    bind=True,
    autoretry_for=(OSError, IOError),
    max_retries=3,
    retry_backoff=60,
)
def convert_audio(
    self,
    file_path: str | Path,
    song_uuid: str | UUID,
    initiator_uuid: str | UUID = None,
    operation_id: str | UUID = None,
    delete_orig_file: bool = True,
):
    str_uuid = str(song_uuid)
    upload_manager = UploadManager(str(song_uuid))
    upload_manager.set_status("processing")
    send_ws_event(
        user_group(initiator_uuid),
        event_name=ServerEvent.SONG_UPLOAD,
        uuid=str(song_uuid),
        status="processing",
        operation_id=operation_id,
    )

    try:
        result = AudioProcessingPipeline.run(
            source=file_path,
            final_storage_dir=os.path.join(settings.AUDIO_CONTENT_PATH, str_uuid),
        )
        song_repr = result.song_repr

    except Exception:
        logger.exception(f"Audio processing failed for song {song_uuid}")
        send_ws_event(
            user_group(initiator_uuid),
            event_name=ServerEvent.SONG_UPLOAD,
            uuid=str(song_uuid),
            status="failed",
            operation_id=operation_id,
        )
        raise

    try:
        with transaction.atomic():
            song = BaseSong.objects.get(uuid=song_uuid)
            song.content_path = song_repr.content_path
            song.mpd = song_repr.manifests[ManifestType.MPD]
            song.m3u8 = song_repr.manifests[ManifestType.M3U8]
            song.draft = False
            song.save()

        def notify():
            upload_manager.set_status("ready")
            send_ws_event(
                user_group(initiator_uuid),
                event_name=ServerEvent.SONG_UPLOAD,
                uuid=str(song_uuid),
                status="ready",
                operation_id=operation_id,
            )

        transaction.on_commit(notify)

    except Exception:
        logger.exception(f"Database update failed for song {song_uuid}")

        try:
            if song_repr and song_repr.content_path:
                delete_django_storage_dir(song_repr.content_path)
        except Exception:
            logger.exception(
                f"Failed to cleanup storage after DB error for song {song_uuid}"
            )

        upload_manager.set_status("failed")
        send_ws_event(
            user_group(initiator_uuid),
            event_name=ServerEvent.SONG_UPLOAD,
            uuid=str(song_uuid),
            status="failed",
            operation_id=operation_id,
            detail="Audio processing failed. Please try again.",
        )
        raise

    finally:
        if delete_orig_file:
            Path(file_path).unlink(missing_ok=True)
