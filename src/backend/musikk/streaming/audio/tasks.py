import os
from pathlib import Path
from uuid import UUID

from celery import shared_task
from django.conf import settings
from django.db import transaction
from django.core.files.storage import default_storage

from sse.config import EventChannels
from sse.events import Event
from streaming.audio.ffmpeg_wrapper import FFMPEGFull, ManifestType, FFMPEGWrapper
from streaming.songs import BaseSong


@shared_task(bind=True)
def convert_audio(
        self,
        file_path: str | Path,
        song_uuid: str | UUID,
        initiator_uuid: str | UUID = None,
        delete_orig_file: bool = True
):
    str_uuid = str(song_uuid)
    try:
        song_repr = FFMPEGFull.convert_audio(
            file_path=file_path,
            storage_dir=os.path.join(settings.AUDIO_CONTENT_PATH, str_uuid),
            out_file_prefix=str_uuid
        )
    except Exception as ex:
        # TODO
        raise

    with transaction.atomic():
        try:
            song = BaseSong.objects.get(uuid=song_uuid)
        except Exception as ex:
            # TODO
            FFMPEGWrapper._cleanup(song_repr.content_path)
            raise

        song.content_path = song_repr.content_path
        song.mpd = default_storage.url(song_repr.manifests[ManifestType.MPD])
        song.m3u8 = default_storage.url(song_repr.manifests[ManifestType.M3U8])
        song.save()

    if initiator_uuid:
        Event.upload_event(
            channel=EventChannels.user_events(initiator_uuid),
            operation_id=str_uuid,
            status="success"
        )

    if delete_orig_file:
        Path(file_path).unlink(missing_ok=True)
