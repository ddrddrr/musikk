import os.path
import shutil
import uuid
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
)


class SongRepresentation:
    def __init__(
        self, manifests: dict, uuid_: uuid.UUID, song_content_path: str | Path
    ):
        # TODO: make also a class or a named tuple
        self.song_content_path = song_content_path
        self.manifests = manifests  # {"mpd_path": ..., "m3u8_path":...}
        self.uuid_ = uuid_


# TODO: add cleanup logic in case of failures
class FFMPEGWrapper:
    def __init__(
        self,
        audio_content_path: str | Path = settings.AUDIO_CONTENT_PATH,
        cleanup: bool = True,
    ):
        assert audio_content_path is not None, "audio_content_path must be a Path"
        self.audio_content_path = Path(audio_content_path)
        self.converters: list[AudioConverter] = []
        self.cleanup = cleanup

    def add_converter(self, converter: AudioConverter) -> Self:
        self.converters.append(converter)
        return self

    # TODO: remove raw file when not in debug?
    def convert_song(
        self, song: bytes | BytesIO | InMemoryUploadedFile | TemporaryUploadedFile
    ) -> SongRepresentation:
        # TODO: improve handling
        if not song:
            raise ValueError("No song provided")
        if not self.converters:
            raise Exception("No converters to use")

        song_uuid = uuid.uuid4()
        song_content_path = self._prepare_content_dir(song_uuid=song_uuid)
        try:
            song_path = self._prepare_song_file(
                song=song, song_content_path=song_content_path
            )

            command = (
                self.input_file_args(song_path)
                + self.converter_args()
                + self.output_type_args()
            )
            mpd_path = self.mpd_path(
                song_uuid=song_uuid, song_content_path=song_content_path
            )
            command.append(mpd_path)

            ffmpeg_result = subprocess.run(command, capture_output=True, text=True)
            if ffmpeg_result.returncode != 0:
                raise Exception(
                    f"ffmpeg could not process input file."
                    f"\nError: {ffmpeg_result.stderr}"
                    f"\nInput args: {ffmpeg_result.args}"
                )

            return SongRepresentation(
                manifests={"mpd_path": mpd_path},
                uuid_=song_uuid,
                song_content_path=song_content_path,
            )
        except Exception:
            if self.cleanup:
                self._cleanup(song_content_path=song_content_path)
            raise

    def input_file_args(self, song_path: Path) -> list[str]:
        return ["ffmpeg", "-i", str(song_path)]

    def output_type_args(self) -> list[str]:
        return ["-f", "dash"]

    def mpd_path(self, song_uuid: uuid.UUID, song_content_path: Path) -> str:
        return str(song_content_path / f"{song_uuid}.mpd")

    def converter_args(self) -> list[str]:
        channel_input = 0
        commands = []
        for converter in self.converters:
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

    # TODO: move somwehere else?
    def _prepare_song_file(
        self,
        song: bytes | BytesIO | InMemoryUploadedFile | TemporaryUploadedFile,
        song_content_path: Path,
    ) -> Path:
        if not isinstance(song, bytes):
            song = song.read()
        file_type = magic.Magic(mime=True).from_buffer(song)
        if not file_type.startswith("audio/"):
            raise ValueError(f"Expected audio file, got {file_type}")

        extension = file_type.split("/")[-1]
        song_path = song_content_path / f"raw.{extension}"

        with open(song_path, "wb") as f:
            f.write(song)

        return song_path

    @staticmethod
    def _cleanup(song_content_path: Path) -> None:
        shutil.rmtree(song_content_path)


FlacOnly = FFMPEGWrapper().add_converter(FLAC_CONVERTER)
Full = (
    FFMPEGWrapper()
    .add_converter(FLAC_CONVERTER)
    .add_converter(AACHEv2_CONVERTER)
    .add_converter(OPUS_CONVERTER)
)
