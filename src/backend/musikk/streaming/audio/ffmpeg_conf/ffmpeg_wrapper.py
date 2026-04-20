import logging
from concurrent.futures import ThreadPoolExecutor
from enum import StrEnum
from pathlib import Path

from streaming.audio.config import DEFAULT_LOSSY_BITRATE, is_lossy_codec
from streaming.audio.exceptions import AudioProcessingPipelineError
from streaming.audio.probes import AudioStreamInfo
from streaming.audio.ffmpeg_conf.converters import (
    FFMPEGAudioConverter,
    FLAC_CONVERTER,
    AACHEv2_CONVERTER,
    AAC_96_CONVERTER,
    AAC_160_CONVERTER,
    AAC_320_CONVERTER,
)

logger = logging.getLogger(__name__)


class StreamingProtocol(StrEnum):
    DASH = "dash"
    HLS = "hls"


class FFMPEGWrapper:
    """
    Runs FFmpeg converters in parallel via ThreadPoolExecutor and writes output
    to a local directory. Converters run as threads, each spawning an FFmpeg subprocess.
    Threads are used, since the parallelization is handled by FFmpeg itself.
    """

    def __init__(self, audio_converters: list[FFMPEGAudioConverter]):
        assert audio_converters, "`audio_converters` must be set"
        self.audio_converters: list[FFMPEGAudioConverter] = audio_converters

    def convert_audio(
        self,
        file_path: str | Path,
        output_dir: str | Path,
        audio_info: AudioStreamInfo,
        filters: list[str] | None = None,
    ) -> list[str]:
        """
        Transcodes audio into formats defined by the configured converters.

        Converters run in parallel. All output files are written to `output_dir`.

        Args:
            file_path: Path to the source audio file.
            output_dir: Local directory where converted files are written.
            audio_info: AudioStreamInfo for tier selection and normalization.
            filters: FFmpeg audio filter strings to apply (normalization, etc.).

        Returns:
            List of local file paths for each converted output.
        """
        converters = self._select_converters(audio_info)
        if not converters:
            raise AudioProcessingPipelineError("No suitable converter for audio")

        with ThreadPoolExecutor(max_workers=len(converters)) as executor:
            futures = [
                executor.submit(
                    converter.convert_song,
                    file_path=file_path,
                    storage_dir=Path(output_dir),
                    filters=filters,
                )
                for converter in converters
            ]
            return [f.result() for f in futures]

    def _select_converters(
        self, audio_info: AudioStreamInfo
    ) -> list[FFMPEGAudioConverter]:
        """
        For lossy sources: skip lossless and any AAC whose bitrate is bigger than the source.
        Lossy-to-AAC is accepted because DASH/HLS packaging
        requires a consistent codec across all representations (even though it leads to generation loss :(
        """
        if not is_lossy_codec(audio_info.codec_name):
            return self.audio_converters

        source_kbps = (
            audio_info.bit_rate // 1000
            if audio_info.bit_rate
            else DEFAULT_LOSSY_BITRATE
        )

        selected = []
        for c in self.audio_converters:
            if c.lossless:
                continue
            if c.bitrate is not None and c.bitrate > source_kbps:
                continue
            selected.append(c)

        return selected


FFMPEGFlacOnly = FFMPEGWrapper(audio_converters=[FLAC_CONVERTER])
FFMPEGFull = FFMPEGWrapper(
    audio_converters=[
        FLAC_CONVERTER,
        AACHEv2_CONVERTER,
        AAC_96_CONVERTER,
        AAC_160_CONVERTER,
        AAC_320_CONVERTER,
    ]
)
