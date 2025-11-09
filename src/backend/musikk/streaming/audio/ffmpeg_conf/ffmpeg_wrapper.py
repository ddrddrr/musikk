import typing
from enum import StrEnum
from pathlib import Path
import tempfile

from django.conf import settings

from musikk.utils.storage import local_dir_to_django_storage, delete_django_storage_dir
from streaming.audio.ffmpeg_conf.converters import (
    FFMPEGAudioConverter,
    FLAC_CONVERTER,
    AACHEv2_CONVERTER,
    OPUS_96_CONVERTER,
    OPUS_160_CONVERTER,
    OPUS_256_CONVERTER,
    AAC_96_CONVERTER,
    AAC_160_CONVERTER,
    AAC_320_CONVERTER,
)


class StreamingProtocol(StrEnum):
    DASH = "dash"
    HLS = "hls"


# TODO: add handling for lossy formats(e.g. mp3)
class FFMPEGWrapper:
    def __init__(
        self,
        audio_converters: list[FFMPEGAudioConverter],
        audio_content_path: str | Path = settings.AUDIO_CONTENT_PATH,
        do_cleanup: bool = True,
    ):
        assert audio_content_path is not None, "`audio_content_path` must be provided"
        assert audio_converters, "`audio_converters` must be set"

        self.audio_converters: list[FFMPEGAudioConverter] = audio_converters
        self.audio_content_path = Path(audio_content_path)
        self.do_cleanup = do_cleanup

    def convert_audio(
        self, file_path: str | Path, storage_dir: str | Path
    ) -> list[str]:
        """
        Transmuxes audio from one format to other formats defined by `converter_map` attribute.

        Args:
            file_path (str|Path): Path to the directory containing the chunks/manifests of a song.
            storage_dir (str|Path):
                Relative Path to the media directory.
                In case of local FS storage should be a subdir of MEDIA_ROOT directory.

        Returns:
            List of paths for created files.
        """
        assert file_path, "No song path provided."

        with tempfile.TemporaryDirectory() as tmpdir:
            for converter in self.audio_converters:
                try:
                    converter.convert_song(
                        file_path=file_path, storage_dir=Path(tmpdir)
                    )
                except Exception:
                    if self.do_cleanup:
                        delete_django_storage_dir(storage_dir=storage_dir)
                    raise

            orig_to_transferred_path_map = local_dir_to_django_storage(
                local_dir=tmpdir, storage_prefix=storage_dir
            )
            return list(orig_to_transferred_path_map.values())


FFMPEGFlacOnly = FFMPEGWrapper(audio_converters=[FLAC_CONVERTER])
FFMPEGFull = FFMPEGWrapper(
    audio_converters=[
        FLAC_CONVERTER,
        OPUS_96_CONVERTER,
        OPUS_160_CONVERTER,
        OPUS_256_CONVERTER,
        AACHEv2_CONVERTER,
        AAC_96_CONVERTER,
        AAC_160_CONVERTER,
        AAC_320_CONVERTER,
    ]
)
