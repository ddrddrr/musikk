import logging
from concurrent.futures import ThreadPoolExecutor
from enum import StrEnum
from pathlib import Path

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


# TODO: add handling for lossy formats(e.g. mp3)
# An alternative would be to fan out each converter as a separate Celery task
# (celery group/chord).
# That would allow distributed processing and per-converter retries,
# but we would need to store intermediate files in a shared storage
# so that the next pipeline step (Shaka Packager) could access them.
# We have a small amount of converters processing a single audio file,
# so this is fine for now.
class FFMPEGWrapper:
    """
    Runs FFmpeg converters in parallel via ThreadPoolExecutor and writes output
    to a local directory. Converters run as threads, each spawning an FFmpeg subprocess.
    """

    def __init__(self, audio_converters: list[FFMPEGAudioConverter]):
        assert audio_converters, "`audio_converters` must be set"
        self.audio_converters: list[FFMPEGAudioConverter] = audio_converters

    def convert_audio(
        self, file_path: str | Path, output_dir: str | Path
    ) -> list[str]:
        """
        Transcodes audio into formats defined by the configured converters.

        Converters run in parallel. All output files are written to output_dir.

        Args:
            file_path: Path to the source audio file.
            output_dir: Local directory where converted files are written.

        Returns:
            List of local file paths for each converted output.
        """
        assert file_path, "No song path provided."

        output_dir = Path(output_dir)
        with ThreadPoolExecutor(max_workers=len(self.audio_converters)) as executor:
            futures = [
                executor.submit(
                    converter.convert_song,
                    file_path=file_path,
                    storage_dir=output_dir,
                )
                for converter in self.audio_converters
            ]
            return [f.result() for f in futures]


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
