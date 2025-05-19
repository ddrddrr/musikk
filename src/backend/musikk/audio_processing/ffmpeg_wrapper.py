import shutil
import uuid
from enum import Enum
from io import BytesIO
from pathlib import Path
import subprocess
from typing import Self

import magic
from django.conf import settings
from django.core.files.uploadedfile import InMemoryUploadedFile, TemporaryUploadedFile

from audio_processing.converters import (
    AudioConverter,
    FLAC_CONVERTER,
    AACHEv2_CONVERTER,
    OPUS_CONVERTER,
    AAC_CONVERTER,
)
from audio_processing.exceptions import ConversionError

# 2GB, which approx. corresponds to a 32bit, 48khz, stereo, 90min wav file
MAX_FILE_SIZE = (((2**3) ** 10) ** 2) ** 3
ALLOWED_FILE_TYPES = [  # lossless for now
    "wav",
    "vnd.wav",
    "x-wav",
    "bwf",
    "flac",
    "flac",
    "alac",
    "m4a",
    "alac",
    "aiff",
    "aif",
    "aiff",
    "ape",
    "ape",
    "mka",
    "mka",
    "wv",
    "wavpack",
]


class StreamingProtocol(Enum):
    DASH = "dash"
    HLS = "hls"


class SongRepresentation:
    def __init__(
        self, manifests: dict, uuid_: uuid.UUID, song_content_path: str | Path
    ):
        self.song_content_path = song_content_path
        self.manifests: dict[StreamingProtocol, str] = manifests
        self.uuid_ = uuid_


# TODO: allow for mp3?
class FFMPEGWrapper:
    def __init__(
        self,
        audio_content_path: str | Path = settings.AUDIO_CONTENT_PATH,
        cleanup: bool = True,
    ):
        assert audio_content_path is not None, "audio_content_path must be a Path"

        self.audio_content_path = Path(audio_content_path)
        self.cleanup = cleanup
        self.converter_map: dict[StreamingProtocol, list[AudioConverter]] = {}

    def add_converter(
        self, protocol: StreamingProtocol, converter: AudioConverter
    ) -> Self:
        self.converter_map.setdefault(protocol, []).append(converter)
        return self

    def convert_song(
        self, song: bytes | BytesIO | InMemoryUploadedFile | TemporaryUploadedFile
    ) -> SongRepresentation:
        # TODO: improve handling
        if not song:
            raise ValueError("No song provided")
        if not self.converter_map:
            raise Exception("No converters to use")

        song_uuid = uuid.uuid4()
        song_content_path = self._prepare_content_dir(song_uuid=song_uuid)
        try:
            song_path = self._prepare_song_file(
                song=song, song_content_path=song_content_path
            )

            manifests = {}
            for protocol in self.converter_map.keys():
                command = (
                    self.input_file_args(song_path)
                    + self.converter_args(protocol)
                    + self.output_type_args(protocol)
                )
                output_path = self.output_path(
                    protocol=protocol,
                    song_uuid=song_uuid,
                    song_content_path=song_content_path,
                )
                command.append(output_path)

                ffmpeg_result = subprocess.run(command, capture_output=True, text=True)
                if ffmpeg_result.returncode != 0:
                    raise Exception(
                        f"ffmpeg could not process input file."
                        f"\nError: {ffmpeg_result.stderr}"
                        f"\nInput args: {ffmpeg_result.args}"
                    )
                manifests[protocol] = output_path

            return SongRepresentation(
                manifests=manifests,
                uuid_=song_uuid,
                song_content_path=song_content_path,
            )
        except Exception as ex:
            if self.cleanup:
                self._cleanup(song_content_path=song_content_path)
            raise ConversionError from ex

    def input_file_args(self, song_path: Path) -> list[str]:
        return ["ffmpeg", "-i", str(song_path)]

    def output_type_args(self, protocol) -> list[str]:
        if protocol == StreamingProtocol.DASH:
            return ["-f", "dash"]
        elif protocol == StreamingProtocol.HLS:
            return [
                "-f",
                "hls",
                "-hls_playlist_type",
                "vod",  # makes playlist const
            ]
        else:
            raise ValueError(f"Unsupported protocol: {protocol}")

    def output_path(
        self, protocol, song_uuid: uuid.UUID, song_content_path: Path
    ) -> str:
        if protocol == StreamingProtocol.DASH:
            return str(song_content_path / f"{song_uuid}.mpd")
        elif protocol == StreamingProtocol.HLS:
            return str(song_content_path / f"{song_uuid}.m3u8")
        else:
            raise ValueError(f"Unsupported protocol: {protocol}")

    def converter_args(self, protocol) -> list[str]:
        channel_input = 0
        commands = []
        for converter in self.converter_map[protocol]:
            ffmpeg_command = converter.construct_ffmpeg_command(channel_input)
            for sublist in ffmpeg_command:
                commands.extend(sublist)

            if bitrate_count := len(converter.bitrates):
                channel_input += bitrate_count
            else:
                channel_input += 1

        return commands

    def _prepare_content_dir(self, song_uuid: uuid.UUID) -> Path:
        song_content_path = self.audio_content_path / str(song_uuid)
        try:
            song_content_path.mkdir(parents=True, exist_ok=False)
        except FileExistsError:
            raise FileExistsError(f"Directory {song_content_path} already exists")

        return song_content_path

    # TODO: remove saved raw file when not in debug?
    def _prepare_song_file(
        self,
        song: bytes | BytesIO | InMemoryUploadedFile | TemporaryUploadedFile,
        song_content_path: Path,
    ) -> Path:
        # TODO: rewrite to use bytesio instead of reading full into memory as bytes
        if not isinstance(song, bytes):
            song = song.read()

        size = len(song)
        if size > MAX_FILE_SIZE:
            raise ValueError(f"Max audio file size exceeded. Actual size {size}")

        file_type = magic.from_buffer(song, mime=True)
        if not file_type.startswith("audio/"):
            raise ValueError(f"Expected audio file, got {file_type}.")

        if not file_type.removeprefix("audio/") in ALLOWED_FILE_TYPES:
            raise ValueError(f"Invalid audio format, got {file_type}.")

        extension = file_type.split("/")[-1]
        song_path = song_content_path / f"raw.{extension}"

        with open(song_path, "wb") as f:
            f.write(song)

        return song_path

    @staticmethod
    def _cleanup(song_content_path: Path) -> None:
        shutil.rmtree(song_content_path)


FlacOnly = FFMPEGWrapper().add_converter(StreamingProtocol.DASH, FLAC_CONVERTER)
Full = (
    FFMPEGWrapper()
    # .add_converter(StreamingProtocol.DASH, FLAC_CONVERTER)
    .add_converter(StreamingProtocol.DASH, AACHEv2_CONVERTER)
    .add_converter(StreamingProtocol.DASH, OPUS_CONVERTER)
    .add_converter(StreamingProtocol.HLS, AAC_CONVERTER)
    .add_converter(StreamingProtocol.HLS, AACHEv2_CONVERTER)
)
