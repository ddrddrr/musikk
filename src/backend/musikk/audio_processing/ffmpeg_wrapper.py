import uuid
from pathlib import Path
import subprocess
from typing import Self

import magic
from django.conf import settings

from audio_processing.converters import AudioConverter


# TODO: add cleanup logic in case of failures


class FFMPEGWrapper:
    def __init__(self):
        self.converters: list[AudioConverter] = []

    def add_converter(self, converter: AudioConverter) -> Self:
        self.converters.append(converter)
        return self

    def convert_song(self, song: bytes) -> dict[str, str]:
        """Returns manifest paths - {manifest_format: path}"""
        # TODO: improve handling
        if not song:
            raise ValueError("No song provided")
        if not self.converters:
            raise Exception("No converters to use")

        song_uuid = uuid.uuid4()
        song_content_path = self._prepare_content_dir(song_uuid=song_uuid)
        song_path = self._prepare_song_file(
            song=song, song_content_path=song_content_path
        )

        command = ["ffmpeg", "-i", str(song_path)]  # provide input file
        command.extend(self.construct_converter_commands())  # add convert options
        command.extend(["-f", "dash"])  # specify that dash is used as protocol
        mpd_path = str(song_content_path / f"{song_uuid}.mpd")
        command.append(mpd_path)

        ffmpeg_result = subprocess.run(command, capture_output=True, text=True)
        if ffmpeg_result.returncode != 0:
            raise Exception(
                f"ffmpeg could not process audio.\nError: {ffmpeg_result.stderr}\n{ffmpeg_result.args}"
            )

        return {"mpd_path": mpd_path}

    def construct_converter_commands(self) -> list[str]:
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

    # TODO: move to view?
    def _prepare_song_file(self, song: bytes, song_content_path: Path) -> Path:
        mime = magic.Magic(mime=True)
        file_type = mime.from_buffer(song)
        if not file_type.startswith("audio/"):
            raise ValueError("Invalid audio file")

        extension = file_type.split("/")[-1]
        song_path = song_content_path / f"raw.{extension}"

        with open(song_path, "wb") as f:
            f.write(song)

        return song_path
