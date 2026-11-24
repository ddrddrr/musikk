from dataclasses import dataclass
from pathlib import Path
from typing import Literal
from uuid import uuid4

from django.conf import settings
from utils.cmd import run_shell_command

from streaming.audio.config import FORMAT_WHITELIST_ARGS


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
        - `-format_whitelist <demuxers>`
            open the input only with an allowed demuxer
        - `-vn -sn -dn`
            remove video, subtitle, and data streams (keep audio only)
        - `-af <filters>`
            audio filter graph (e.g. aresample)
        - `-c:a <encoder>`
            audio codec (e.g. flac, libfdk_aac)
        - `-b:a <bitrate>k`
            target bitrate (kbps)
        - `-movflags +faststart`
            move the moov atom to the beginning of the file for faster streaming start
    """
    parts: list[str] = [
        settings.FFMPEG_BIN,
        *FORMAT_WHITELIST_ARGS,
        "-i",
        str(input_path),
    ]

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
        lossless: bool = False,
        # some encoders fail when given a mono input, so this is used as an alternative for mono
        mono_variant: "FFMPEGAudioConverter | None" = None,
    ):
        self.encoder = encoder
        self.bitrate = bitrate
        self.extras = extras or []
        self.lossless = lossless
        self.mono_variant = mono_variant

    def for_channels(self, channels: int) -> "FFMPEGAudioConverter":
        if channels == 1 and self.mono_variant:
            return self.mono_variant
        return self

    def convert_song(
        self,
        file_path: Path,
        storage_dir: Path,
        filters: list[str] | None = None,
        timeout: float | None = None,
    ) -> "ConvertedFile":
        """
        Transcodes a single audio file. The result keeps the converter, so later
        steps can choose a file by its codec and bitrate, not by its name.
        `timeout` is in s, None means no limit.
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
            ),
            timeout=timeout,
        )

        return ConvertedFile(path=output_path, converter=self)

    def _output_file_path_arg(self, storage_dir: Path) -> str:
        return str(
            storage_dir / f"{self.encoder}-{self.bitrate or 'static'}-{uuid4().hex}.mp4"
        )


@dataclass(frozen=True)
class ConvertedFile:
    path: str
    converter: FFMPEGAudioConverter


FLAC_CONVERTER = FFMPEGAudioConverter("flac", lossless=True)

AACHEv2_CONVERTER = FFMPEGAudioConverter(
    encoder="libfdk_aac",
    bitrate=24,
    extras=["-profile:a", "aac_he_v2"],
    # see https://trac.ffmpeg.org/wiki/Encode/AAC#Examples2
    mono_variant=FFMPEGAudioConverter(
        encoder="libfdk_aac",
        bitrate=24,
        extras=["-profile:a", "aac_he"],
    ),
)

AAC_96_CONVERTER = FFMPEGAudioConverter(encoder="libfdk_aac", bitrate=96)
AAC_160_CONVERTER = FFMPEGAudioConverter(encoder="libfdk_aac", bitrate=160)
AAC_320_CONVERTER = FFMPEGAudioConverter(encoder="libfdk_aac", bitrate=320)
