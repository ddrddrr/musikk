from pathlib import Path
from typing import Literal
from uuid import uuid4

from django.conf import settings

from utils.cmd import run_shell_command


def build_ffmpeg_command(
    input_path: Path,
    output_path: Path,
    encoder: str,
    bitrate: int | None = None,
    extras: list[str] | None = None,
    filters: list[str] | None = None,
) -> list[str]:
    """
    Build an ffmpeg transcoding command.

    ffmpeg flags:
        - `-vn -sn -dn`
            remove video, subtitle, and data streams (keep audio only)
        - `-af <filters>`
            audio filter graph (e.g. loudnorm, volume)
        - `-c:a <encoder>`
            audio codec (e.g. flac, libfdk_aac)
        - `-b:a <bitrate>k`
            target bitrate (kbps)
        - `-movflags +faststart`
            move the moov atom to the beginning of the file for faster streaming start
    """
    parts: list[str] = [settings.FFMPEG_BIN, "-i", str(input_path)]

    parts += ["-vn", "-sn", "-dn"]
    if filters:
        parts += ["-af", ",".join(filters)]

    parts += ["-c:a", encoder]

    if extras:
        parts += list(extras)

    if bitrate:
        parts += ["-b:a", f"{bitrate}k"]

    parts += ["-movflags", "+faststart"]

    parts.append(str(output_path))

    return parts


class FFMPEGAudioConverter:
    def __init__(
        self,
        encoder: Literal["flac", "libfdk_aac"],
        bitrate: int | None = None,
        extras: list[str] | None = None,
        timeout: int | None = 60,
        lossless: bool = False,
    ):
        self.encoder = encoder
        self.bitrate = bitrate
        self.extras = extras or []
        self.timeout = timeout
        self.lossless = lossless

    def convert_song(
        self,
        file_path: Path,
        storage_dir: Path,
        filters: list[str] | None = None,
    ) -> str:
        """
        Transcodes a single audio file and returns the local output path (string).
        """
        output_path = self._output_file_path_arg(storage_dir=storage_dir)

        run_shell_command(
            build_ffmpeg_command(
                input_path=file_path,
                output_path=Path(output_path),
                encoder=self.encoder,
                bitrate=self.bitrate,
                extras=self.extras,
                filters=filters,
            )
        )

        return output_path

    def _output_file_path_arg(self, storage_dir: Path) -> str:
        return str(
            storage_dir
            / f"{self.encoder}-{str(self.bitrate) or 'static'}-{uuid4().hex}.mp4"
        )


FLAC_CONVERTER = FFMPEGAudioConverter("flac", lossless=True)

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
