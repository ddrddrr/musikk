from pathlib import Path
from typing import Literal
from uuid import uuid4

from django.conf import settings

from utils.cmd import run_shell_command


class FFMPEGCommand:
    def __init__(
        self,
        input_path: Path,
        output_path: Path,
        encoder: str,
        bitrate: int | None = None,
        extras: list[str] | None = None,
        strip_non_audio: bool = True,
        movflags_faststart: bool = True,
    ):
        self.input_path = input_path
        self.output_path = output_path
        self.encoder = encoder
        self.bitrate = bitrate
        self.extras = extras or []
        self.strip_non_audio = strip_non_audio
        self.movflags_faststart = movflags_faststart

    def build(self) -> list[str]:
        parts: list[str] = []
        parts += self._input_args()
        parts += self._strip_non_audio_args()
        parts += self._encoder_args()
        parts += self._extras_args()
        parts += self._bitrate_args()
        parts += self._save_options_args()
        parts += self._output_arg()
        return parts

    def _input_args(self) -> list[str]:
        return [settings.FFMPEG_BIN, "-i", str(self.input_path)]

    def _strip_non_audio_args(self) -> list[str]:
        return ["-vn", "-sn", "-dn"] if self.strip_non_audio else []

    def _encoder_args(self) -> list[str]:
        return ["-c:a", self.encoder]

    def _bitrate_args(self) -> list[str]:
        if self.bitrate:
            return ["-b:a", f"{self.bitrate}k"]
        return []

    def _extras_args(self) -> list[str]:
        return list(self.extras) if self.extras else []

    def _save_options_args(self) -> list[str]:
        return ["-movflags", "+faststart"] if self.movflags_faststart else []

    def _output_arg(self) -> list[str]:
        return [str(self.output_path)]


# TODO: probably change so bitrate is set at runtime(to be more extensible)
class FFMPEGAudioConverter:
    def __init__(
        self,
        encoder: Literal["flac", "libfdk_aac"],
        bitrate: int | None = None,
        extras: list[str] | None = None,
        timeout: int | None = 60,
    ):
        self.encoder = encoder
        self.bitrate = bitrate
        self.extras = extras or []
        self.timeout = timeout

    def convert_song(self, file_path: Path, storage_dir: Path) -> str:
        """
        Transcodes a single audio file and returns the local output path (string).
        """
        output_path = self._output_file_path_arg(storage_dir=storage_dir)

        run_shell_command(
            FFMPEGCommand(
                input_path=file_path,
                output_path=Path(output_path),
                encoder=self.encoder,
                bitrate=self.bitrate,
                extras=self.extras,
            ).build()
        )

        return output_path

    def _output_file_path_arg(self, storage_dir: Path) -> str:
        return str(
            storage_dir
            / f"{self.encoder}-{str(self.bitrate) or 'static'}-{uuid4().hex}.mp4"
        )


FLAC_CONVERTER = FFMPEGAudioConverter("flac")

AACHEv2_CONVERTER = FFMPEGAudioConverter(
    encoder="libfdk_aac",
    bitrate=24,
    extras=[
        "-profile",
        "aac_he_v2",
    ],  # see https://trac.ffmpeg.org/wiki/Encode/AAC#Examples2
)

AAC_96_CONVERTER = FFMPEGAudioConverter(encoder="libfdk_aac", bitrate=96)
AAC_160_CONVERTER = FFMPEGAudioConverter(encoder="libfdk_aac", bitrate=160)
AAC_320_CONVERTER = FFMPEGAudioConverter(encoder="libfdk_aac", bitrate=320)
