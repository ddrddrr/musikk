from streaming.audio.config import (
    SAMPLE_RATE_44_FAMILY,
    SAMPLE_RATE_48_FAMILY,
    TARGET_SAMPLE_RATE_44_1,
    TARGET_SAMPLE_RATE_48,
)
from streaming.audio.probes import AudioStreamInfo


def _compute_target_sample_rate(source_rate: int) -> int | None:
    """44.1k * x -> 44.1k, 48k * x -> 48k, below 44.1k -> keep."""
    if source_rate in SAMPLE_RATE_44_FAMILY:
        return (
            TARGET_SAMPLE_RATE_44_1 if source_rate != TARGET_SAMPLE_RATE_44_1 else None
        )
    if source_rate in SAMPLE_RATE_48_FAMILY:
        return TARGET_SAMPLE_RATE_48 if source_rate != TARGET_SAMPLE_RATE_48 else None
    if source_rate < TARGET_SAMPLE_RATE_44_1:
        return None
    # 44.1khz for any non-standard high rate
    return TARGET_SAMPLE_RATE_44_1


def _compute_target_channels(source_channels: int) -> int | None:
    """Mono stays mono, stereo stays stereo, 3+ channels -> stereo."""
    if source_channels <= 2:
        return None
    return 2


def build_normalization_filters(info: AudioStreamInfo) -> list[str]:
    """Build FFmpeg -af filter strings for channel, sample rate, and bit depth normalization."""
    filters: list[str] = []

    target_channels = _compute_target_channels(info.channels)
    if target_channels is not None:
        filters.append("aresample=ocl=stereo")

    target_rate = _compute_target_sample_rate(info.sample_rate)
    if target_rate is not None:
        filters.append(f"aresample={target_rate}")

    filters.append("aformat=sample_fmts=s16")

    return filters
