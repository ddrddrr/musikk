import logging
import os
from pathlib import Path
from uuid import UUID

from celery import shared_task
from django.conf import settings
from django.db import transaction
from django.core.files.storage import default_storage

from musikk.utils.storage import delete_django_storage_dir
from streaming.audio.processing_pipeline import AudioProcessingPipeline
from streaming.audio.shaka_packager_conf.shaka_packager_wrapper import ManifestType
from streaming.managers.upload_manager import UploadManager
from streaming.models.songs import BaseSong
from websockets.event_helpers import send_ws_event

logger = logging.getLogger(__name__)


def send_upload_event(
    initiator_uuid: str | UUID | None,
    song_uuid: str | UUID,
    success: bool,
    detail: str | None = None,
) -> None:
    if not initiator_uuid:
        return

    try:
        payload = {
            "success": success,
            "uuid": str(song_uuid),
        }
        if detail:
            payload["detail"] = detail

        send_ws_event(
            f"user_{initiator_uuid}",
            event_name="song.upload",
            **payload,
        )
    except Exception:
        logger.exception(
            f"Failed to send WebSocket event for song {song_uuid}, success={success}"
        )


@shared_task(bind=True)
def convert_audio(
    self,
    file_path: str | Path,
    song_uuid: str | UUID,
    initiator_uuid: str | UUID = None,
    delete_orig_file: bool = True,
):
    str_uuid = str(song_uuid)
    um = UploadManager(str(song_uuid))
    um.set_status("processing")
    send_ws_event(
        f"user_{initiator_uuid}",
        event_name="song.upload",
        uuid=str(song_uuid),
        status="processing",
    )

    try:
        result = AudioProcessingPipeline.run(
            source=file_path,
            final_storage_dir=os.path.join(settings.AUDIO_CONTENT_PATH, str_uuid),
        )
        song_repr = result.song_repr

        # keep only chunks and manifests
        if result.context.converted_paths:
            for converted_path in result.context.converted_paths:
                try:
                    if default_storage.exists(converted_path):
                        default_storage.delete(converted_path)
                        logger.debug(f"Deleted full encoded file: {converted_path}")
                except Exception:
                    logger.exception(
                        f"Failed to delete encoded file {converted_path} for song {song_uuid}"
                    )

    except Exception:
        logger.exception(f"Audio processing failed for song {song_uuid}")
        send_upload_event(
            initiator_uuid=initiator_uuid,
            song_uuid=song_uuid,
            success=False,
            detail="Audio processing failed. Please try again.",
        )
        raise

    try:
        with transaction.atomic():
            song = BaseSong.objects.get(uuid=song_uuid)
            song.content_path = song_repr.content_path
            song.mpd = default_storage.url(song_repr.manifests[ManifestType.MPD])
            song.m3u8 = default_storage.url(song_repr.manifests[ManifestType.M3U8])
            song.save()

        def notify():
            um.set_status("ready")
            send_ws_event(
                f"user_{initiator_uuid}",
                event_name="song.upload",
                uuid=str(song_uuid),
                status="ready",
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

        um.set_status("failed")
        send_ws_event(
            f"user_{initiator_uuid}",
            event_name="song.upload",
            uuid=str(song_uuid),
            status="failed",
            detail="Audio processing failed. Please try again.",
        )
        raise

    finally:
        if delete_orig_file:
            Path(file_path).unlink(missing_ok=True)
