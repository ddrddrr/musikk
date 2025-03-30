import os.path
import shutil
import uuid
from io import BytesIO
from pathlib import Path
import subprocess
from typing import Self

import magic
from django.conf import settings

from audio_processing.converters import AudioConverter


class SongRepresentation:
    def __init__(self, manifests: dict, uuid_: uuid.UUID):
        self.manifests = manifests
        self.uuid_ = uuid_


# TODO: add cleanup logic in case of failures
class FFMPEGWrapper:
    def __init__(self, song_content_path: str | Path = None, cleanup: bool = False):
        self.converters: list[AudioConverter] = []
        self.song_content_path = song_content_path
        self.cleanup = cleanup

    def add_converter(self, converter: AudioConverter) -> Self:
        self.converters.append(converter)
        return self

    # TODO: remove raw file when not in debug
    def convert_song(self, song: bytes | BytesIO) -> SongRepresentation:
        # TODO: improve handling
        if not song:
            raise ValueError("No song provided")
        if not self.converters:
            raise Exception("No converters to use")

        song_uuid = uuid.uuid4()
        if not self.song_content_path or not os.path.isdir(self.song_content_path):
            self.song_content_path = self._prepare_content_dir(song_uuid=song_uuid)

        try:
            song_path = self._prepare_song_file(song=song)

            command = (
                self.input_file_args(song_path)
                + self.converter_args()
                + self.output_type_args()
            )
            mpd_path = self.mpd_path(song_uuid)
            command.append(mpd_path)

            ffmpeg_result = subprocess.run(command, capture_output=True, text=True)
            if ffmpeg_result.returncode != 0:
                raise Exception(
                    f"ffmpeg could not process input file."
                    "\nError: {ffmpeg_result.stderr}"
                    "\nInput args: {ffmpeg_result.args}"
                )

            return SongRepresentation(manifests={"mpd_path": mpd_path}, uuid_=song_uuid)
        except Exception:
            if self.cleanup:
                self._cleanup()
            raise

    def input_file_args(self, song_path: Path) -> list[str]:
        return ["ffmpeg", "-i", str(song_path)]

    def output_type_args(self) -> list[str]:
        return ["-f", "dash"]

    def mpd_path(self, song_uuid: uuid.UUID):
        return str(self.song_content_path / f"{song_uuid}.mpd")

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
        song_content_path = Path(settings.AUDIO_CONTENT_PATH) / str(song_uuid)
        try:
            song_content_path.mkdir(parents=True, exist_ok=False)
        except FileExistsError:
            raise FileExistsError(f"Directory {song_content_path} already exists")

        return song_content_path

    # TODO: move somwhere else?
    def _prepare_song_file(
        self,
        song: bytes | BytesIO,
    ) -> Path:
        if isinstance(song, BytesIO):
            song = song.read()
        mime = magic.Magic(mime=True)
        file_type = mime.from_buffer(song)
        if not file_type.startswith("audio/"):
            raise ValueError(f"Expected audio file, got {file_type}")

        extension = file_type.split("/")[-1]
        song_path = self.song_content_path / f"raw.{extension}"

        with open(song_path, "wb") as f:
            f.write(song)

        return song_path

    def _cleanup(self):
        shutil.rmtree(self.song_content_path)
