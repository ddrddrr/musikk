import random
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass
from pathlib import Path

from django.conf import settings
from utils.cmd import run_shell_command


@dataclass(frozen=True)
class AudioProfile:
    format: str
    extension: str
    sample_rate: int
    channels: int
    bit_depth: int | None
    bitrate_kbps: int | None
    codec_args: list[str]

    @property
    def label(self) -> str:
        parts = [
            self.format.upper(),
            f"{self.sample_rate}Hz",
            f"{self.channels}ch",
        ]
        if self.bit_depth:
            parts.append(f"{self.bit_depth}bit")
        if self.bitrate_kbps:
            parts.append(f"{self.bitrate_kbps}kbps")
        return " ".join(parts)


LOSSLESS_PROFILES = [
    AudioProfile("wav", ".wav", 44100, 2, 16, None, ["-c:a", "pcm_s16le"]),
    AudioProfile("wav", ".wav", 48000, 2, 24, None, ["-c:a", "pcm_s24le"]),
    AudioProfile("wav", ".wav", 96000, 2, 16, None, ["-c:a", "pcm_s16le"]),
    AudioProfile("wav", ".wav", 44100, 1, 16, None, ["-c:a", "pcm_s16le"]),
    AudioProfile("wav", ".wav", 48000, 6, 16, None, ["-c:a", "pcm_s16le"]),
    AudioProfile("flac", ".flac", 44100, 2, 16, None, ["-c:a", "flac"]),
    AudioProfile(
        "flac", ".flac", 48000, 2, 24, None, ["-c:a", "flac", "-sample_fmt", "s32"]
    ),
    AudioProfile("flac", ".flac", 96000, 2, 16, None, ["-c:a", "flac"]),
    AudioProfile("flac", ".flac", 44100, 1, 16, None, ["-c:a", "flac"]),
    AudioProfile("aiff", ".aiff", 44100, 2, 16, None, ["-c:a", "pcm_s16be"]),
    AudioProfile("aiff", ".aiff", 48000, 2, 24, None, ["-c:a", "pcm_s24be"]),
]

LOSSY_PROFILES = [
    AudioProfile("aac", ".m4a", 44100, 2, None, 128, ["-c:a", "aac", "-b:a", "128k"]),
    AudioProfile("aac", ".m4a", 44100, 2, None, 320, ["-c:a", "aac", "-b:a", "320k"]),
    AudioProfile("aac", ".m4a", 48000, 1, None, 96, ["-c:a", "aac", "-b:a", "96k"]),
    # AudioProfile(
    #     "mp3", ".mp3", 44100, 2, None, 128, ["-c:a", "libmp3lame", "-b:a", "128k"]
    # ),
    # AudioProfile(
    #     "mp3", ".mp3", 44100, 2, None, 320, ["-c:a", "libmp3lame", "-b:a", "320k"]
    # ),
    # AudioProfile(
    #     "mp3", ".mp3", 48000, 1, None, 96, ["-c:a", "libmp3lame", "-b:a", "96k"]
    # ),
    # AudioProfile(
    #     "ogg", ".ogg", 44100, 2, None, 192, ["-c:a", "libvorbis", "-b:a", "192k"]
    # ),
    # AudioProfile(
    #     "ogg", ".ogg", 48000, 2, None, 128, ["-c:a", "libvorbis", "-b:a", "128k"]
    # ),
    # AudioProfile(
    #     "opus", ".opus", 48000, 2, None, 128, ["-c:a", "libopus", "-b:a", "128k"]
    # ),
    # AudioProfile(
    #     "opus", ".opus", 48000, 1, None, 64, ["-c:a", "libopus", "-b:a", "64k"]
    # ),
]

ALL_PROFILES = LOSSLESS_PROFILES + LOSSY_PROFILES

# a sine and some pink/brown noise
# add smth else to make it more interesting, fine for testing for now :)
AUDIO_SOURCES = [
    "sine=frequency={freq}:duration={dur}",
    "anoisesrc=duration={dur}:color=pink:seed={seed}:amplitude=0.5",
    "anoisesrc=duration={dur}:color=brown:seed={seed}:amplitude=0.3",
]


def generate_audio_files(
    count: int,
    output_dir: Path,
    duration_range: tuple[int, int],
    workers: int = 4,
) -> Path:
    output_dir.mkdir(parents=True, exist_ok=True)
    profiles = _pick_audio_profiles(count)

    tasks = []
    for i, profile in enumerate(profiles):
        duration = random.randint(*duration_range)
        source_template = random.choice(AUDIO_SOURCES)
        source = source_template.format(
            freq=random.choice([220, 330, 440, 554, 659, 880]),
            dur=duration,
            seed=random.randint(0, 100000),
        )
        tasks.append((i, profile, duration, source))

    print_lock = threading.Lock()
    errors = []

    with ThreadPoolExecutor(max_workers=workers) as executor:
        future_to_task = {
            executor.submit(
                _generate_audio, profile, duration, output_dir, i, source
            ): (i, profile, duration)
            for i, profile, duration, source in tasks
        }
        for future in as_completed(future_to_task):
            i, profile, duration = future_to_task[future]
            try:
                path = future.result()
                with print_lock:
                    print(f"{profile.label}, {duration}s: {path.name}")
            except Exception as exc:
                errors.append((i, exc))
                with print_lock:
                    print(f"FAILED: {exc}")

    if errors:
        print(f"WARNING: {len(errors)}/{count} audio files failed to generate")
    else:
        print(f"Generated {count} audio files in {output_dir}")
    return output_dir


def _pick_audio_profiles(count: int) -> list[AudioProfile]:
    if count <= len(ALL_PROFILES):
        return random.sample(ALL_PROFILES, count)
    result = list(ALL_PROFILES)
    while len(result) < count:
        result.append(random.choice(ALL_PROFILES))
    random.shuffle(result)
    return result[:count]


def _generate_audio(
    profile: AudioProfile, duration: int, output_dir: Path, index: int, source: str
) -> Path:
    filename = (
        f"sample_{index:03d}_{profile.format}"
        f"_{profile.sample_rate}_{profile.channels}ch"
        f"{profile.extension}"
    )
    output_path = output_dir / filename

    cmd = [
        settings.FFMPEG_BIN,
        "-y",
        "-f",
        "lavfi",
        "-i",
        source,
        "-ar",
        str(profile.sample_rate),
        "-ac",
        str(profile.channels),
        *profile.codec_args,
        str(output_path),
    ]

    run_shell_command(cmd, timeout=120)
    return output_path
