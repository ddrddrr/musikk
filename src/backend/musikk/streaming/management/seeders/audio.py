import os
import random
import tempfile
import threading
import uuid
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

from django.conf import settings
from faker import Faker
from users.models import BaseUser

from streaming.audio.probes import get_audio_metadata
from streaming.audio.processing_pipeline import AudioProcessingPipeline
from streaming.audio.shaka_packager_conf.shaka_packager_wrapper import ManifestType
from streaming.management.constants import DEFAULT_GENERATED_AUDIO_DIR
from streaming.management.seeders.images import ImageProvider
from streaming.models import BaseSong, SongCredit

fake = Faker()


def seed_songs(
    artists: list[BaseUser],
    song_count: int,
    image_provider: ImageProvider,
    skip_audio: bool,
    workers: int = 4,
) -> list[BaseSong]:
    audio_dir = DEFAULT_GENERATED_AUDIO_DIR
    songs: list[BaseSong] = []
    audio_tasks: list[tuple[int, BaseSong, str, str]] = []

    for i in range(song_count):
        audio_path = _pick_random_audio(audio_dir)
        image_file = image_provider.get_image()

        song = BaseSong.objects.create(
            title=fake.catch_phrase(),
            description=fake.text(max_nb_chars=512),
            image=image_file,
            draft=not skip_audio,
        )
        songs.append(song)

        if not skip_audio:
            tmp_path = _copy_to_temp(audio_path)
            storage_dir = os.path.join(settings.AUDIO_CONTENT_PATH, str(uuid.uuid4()))
            audio_tasks.append((i, song, tmp_path, storage_dir))
        else:
            print(
                f"[{i + 1}/{song_count}] Created draft '{song.title}' (audio skipped)"
            )

    if audio_tasks:
        results = _process_audio_parallel(audio_tasks, song_count, workers)

        for song, result, audio_info in results:
            song.content_path = result.song_repr.content_path
            song.mpd = result.song_repr.manifests[ManifestType.MPD]
            song.m3u8 = result.song_repr.manifests[ManifestType.M3U8]
            song.duration_ms = int(audio_info.duration_seconds * 1000)
            song.source_codec = audio_info.codec_name
            song.source_bitrate = audio_info.bit_rate
            song.loudness_lufs = result.loudness_lufs
            song.true_peak_dbtp = result.true_peak_dbtp
            song.draft = False
            song.save()

    for song in songs:
        _assign_credits(song, artists)

    return songs


def _process_audio_parallel(tasks, song_count, workers):
    print_lock = threading.Lock()
    results = []
    errors = []

    def _run_pipeline(i, song, tmp_path, storage_dir):
        with print_lock:
            print(f"Processing '{song.title}'")
        try:
            audio_info = get_audio_metadata(tmp_path)
            result = AudioProcessingPipeline.run(
                source=tmp_path,
                final_storage_dir=storage_dir,
                audio_info=audio_info,
            )
            return song, result, audio_info
        finally:
            _safe_remove(tmp_path)

    with ThreadPoolExecutor(max_workers=workers) as executor:
        future_to_task = {
            executor.submit(_run_pipeline, i, song, tmp_path, storage_dir): (i, song)
            for i, song, tmp_path, storage_dir in tasks
        }
        for future in as_completed(future_to_task):
            i, song = future_to_task[future]
            try:
                results.append(future.result())
            except Exception as exc:
                errors.append((i, song.title, exc))
                with print_lock:
                    print(f"[{i + 1}/{song_count}] FAILED '{song.title}': {exc}")

    if errors:
        print(f"WARNING: {len(errors)}/{song_count} songs failed audio processing")

    return results


def _pick_random_audio(audio_dir: Path) -> Path:
    files = [p for p in audio_dir.iterdir() if p.is_file()]
    if not files:
        raise FileNotFoundError(f"No audio files in {audio_dir}")
    return random.choice(files)


def _copy_to_temp(path: Path) -> str:
    suffix = path.suffix or ".wav"
    with path.open("rb") as rf:
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tf:
            tf.write(rf.read())
            return tf.name


def _assign_credits(song: BaseSong, artists: list[BaseUser]):
    if not artists:
        return
    num_authors = random.randint(1, min(3, len(artists)))
    for priority, author in enumerate(random.sample(artists, num_authors)):
        SongCredit.objects.create(song=song, author=author, author_priority=priority)


def _safe_remove(path: str):
    try:
        if path and os.path.exists(path):
            os.remove(path)
    except Exception:
        print(f"Failed to remove temp file: {path}")
