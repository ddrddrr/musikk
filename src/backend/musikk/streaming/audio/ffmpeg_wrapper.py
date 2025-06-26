import os
import typing
from enum import StrEnum
from pathlib import Path
import subprocess
from typing import Self
import tempfile

from django.conf import settings

from musikk.utils.storage import local_dir_to_storage, delete_storage_dir
from streaming.audio.converters import (
    AudioConverter,
    FLAC_CONVERTER,
    AACHEv2_CONVERTER,
    OPUS_CONVERTER,
    AAC_CONVERTER,
)
from streaming.audio.exceptions import ConversionError


class StreamingProtocol(StrEnum):
    DASH = "dash"
    HLS = "hls"


class ManifestType(StrEnum):
    MPD = "mpd"
    M3U8 = "m3u8"


class SongRepresentation(typing.NamedTuple):
    """
    Attributes:
        content_path(str|Path): Path to the directory containing the chunks/manifests of a song.
        manifests(dict[ManifestType, str | Path]):
            A mapping where keys are manifest types and values are their paths.
            They are always located under the content_path directory.
    """

    content_path: str | Path
    manifests: dict[ManifestType, str | Path]


# TODO: add handling for lossy formats(e.g. mp3)
class FFMPEGWrapper:
    def __init__(
        self,
        audio_content_path: str | Path = settings.AUDIO_CONTENT_PATH,
        cleanup: bool = True,
    ):
        assert audio_content_path is not None, "`audio_content_path` must be provided"

        self.audio_content_path = Path(audio_content_path)
        self.cleanup = cleanup
        self.converter_map: dict[StreamingProtocol, list[AudioConverter]] = {}

    def add_converter(
        self, protocol: StreamingProtocol, converter: AudioConverter
    ) -> Self:
        self.converter_map.setdefault(protocol, []).append(converter)
        return self

    def convert_audio(
        self, file_path: str | Path, storage_dir: str | Path, out_file_prefix: str
    ) -> SongRepresentation:
        """
        Runs the FFMPEG conversion, writes chunks/manifests into a tmp dir, then copies them out
        to the default storage.

        Args:
            file_path (str|Path): Path to the directory containing the chunks/manifests of a song.
            storage_dir (str|Path):
                Relative Path to the storage directory.
                In case of local FS storage should be a subdir of MEDIA_ROOT directory.
            out_file_prefix (str): The prefix for the manifest file names.
        """

        if not file_path:
            raise ValueError("No song path provided.")
        if not self.converter_map:
            raise ValueError("No converters were defined.")

        with tempfile.TemporaryDirectory() as tmpdir:
            try:
                manifests_tmp = {}
                for protocol in self.converter_map.keys():
                    command = (
                        self.input_file_args(file_path)
                        + self.converter_args(protocol)
                        + self.protocol_args(protocol)
                    )
                    manifest_path = self.manifest_path(
                        protocol=protocol,
                        song_file_prefix=out_file_prefix,
                        out_dir=tmpdir,
                    )
                    command.append(manifest_path)

                    ffmpeg_result = subprocess.run(
                        command, capture_output=True, text=True
                    )
                    if ffmpeg_result.returncode != 0:
                        raise Exception(
                            f"ffmpeg could not process input file.\n"
                            f"Error: {ffmpeg_result.stderr}\n"
                            f"Input args: {ffmpeg_result.args}"
                        )

                    match protocol:
                        case StreamingProtocol.DASH:
                            manifests_tmp[ManifestType.MPD] = manifest_path
                        case StreamingProtocol.HLS:
                            manifests_tmp[ManifestType.M3U8] = manifest_path

                try:
                    paths = local_dir_to_storage(
                        local_dir=tmpdir, storage_prefix=storage_dir
                    )
                except Exception:
                    if self.cleanup:
                        self._cleanup(content_dir=storage_dir)
                    raise

                manifests = {}
                for manifest_type, manifest_path in manifests_tmp.items():
                    # set storage path instead of tmp
                    manifests[manifest_type] = paths[manifest_path]

                return SongRepresentation(
                    content_path=storage_dir,
                    manifests=manifests,
                )
            except Exception as ex:
                raise ConversionError(
                    f"Failed to convert audio file {file_path}."
                ) from ex

    def input_file_args(self, song_path: Path) -> list[str]:
        return ["ffmpeg", "-i", str(song_path)]

    def protocol_args(self, protocol: StreamingProtocol) -> list[str]:
        if protocol == StreamingProtocol.DASH:
            return ["-f", "dash", "-adaptation_sets", "id=0, streams=a"]
        elif protocol == StreamingProtocol.HLS:
            return [
                "-f",
                "hls",
                "-hls_playlist_type",
                "vod",  # makes playlist const
            ]
        else:
            raise ValueError(f"Unsupported protocol: {protocol}")

    def manifest_path(
        self, protocol: StreamingProtocol, song_file_prefix: str, out_dir: str
    ) -> str:
        base_path = os.path.join(out_dir, f"{song_file_prefix}")
        if protocol == StreamingProtocol.DASH:
            return f"{base_path}.mpd"
        elif protocol == StreamingProtocol.HLS:
            return f"{base_path}.m3u8"
        else:
            raise ValueError(f"Unsupported protocol: {protocol}")

    def converter_args(self, protocol: StreamingProtocol) -> list[str]:
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

    @staticmethod
    def _cleanup(content_dir: Path) -> None:
        delete_storage_dir(content_dir)


FFMPEGFlacOnly = FFMPEGWrapper().add_converter(StreamingProtocol.DASH, FLAC_CONVERTER)
FFMPEGFull = (
    FFMPEGWrapper()
    # .add_converter(StreamingProtocol.DASH, FLAC_CONVERTER)
    .add_converter(StreamingProtocol.DASH, AACHEv2_CONVERTER)
    .add_converter(StreamingProtocol.DASH, OPUS_CONVERTER)
    .add_converter(StreamingProtocol.HLS, AAC_CONVERTER)
    .add_converter(StreamingProtocol.HLS, AACHEv2_CONVERTER)
)
