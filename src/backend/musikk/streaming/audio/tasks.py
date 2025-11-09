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
from streaming.models.songs import BaseSong


# TODO: retries? and other celery task stuff
@shared_task(bind=True)
def convert_audio(
    self,
    file_path: str | Path,
    song_uuid: str | UUID,
    event_uuid: str | UUID = None,
    delete_orig_file: bool = True,
):
    str_uuid = str(song_uuid)
    try:
        result = AudioProcessingPipeline.run(
            source=file_path,
            final_storage_dir=os.path.join(settings.AUDIO_CONTENT_PATH, str_uuid),
        )
        song_repr = result.song_repr
    except Exception as ex:
        # TODO: optionally emit failure event or perform custom retries
        raise
    try:
        with transaction.atomic():
            song = BaseSong.objects.get(uuid=song_uuid)
            song.content_path = song_repr.content_path
            song.mpd = default_storage.url(song_repr.manifests[ManifestType.MPD])
            song.m3u8 = default_storage.url(song_repr.manifests[ManifestType.M3U8])
            song.save()

    except Exception:
        delete_django_storage_dir(song_repr.content_path)
        # TODO: err handling

    # TODO: emit event

    # TODO: rewrite as storage delete (file should be saved to storage)
    if delete_orig_file:
        # Remove the original uploaded file (best-effort).
        Path(file_path).unlink(missing_ok=True)
