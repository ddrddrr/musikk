import uuid
from abc import abstractmethod, ABC
from typing import Final, override


class Codec:
    opus = "libopus"
    he_aac_v2 = "aac"
    flac = "flac"


class AudioConverter(ABC):
    # -adaptation_sets "id=0,1,2...,streams=a"
    dash_segment_type: Final[str] = "mp4"
    seg_duration: int = 5000
    codec_bitrate_map: dict[str, list[int]] = {}
    # format_options=movflags=frag_keyframe+faststart
    extras: dict = {}

    def __init__(self, song: bytes) -> None:
        self.song = song
        self.song_uuid: uuid.UUID = uuid.uuid4()

    @abstractmethod
    def construct_ffmpeg_command(self) -> str:
        pass

    @property
    @abstractmethod
    def manifest_path(self) -> str:
        pass

    @property
    def min_playback_rate(self) -> int:
        return min(min(v) for v in self.codec_bitrate_map.values())

    @property
    def max_playback_rate(self) -> int:
        return max(max(v) for v in self.codec_bitrate_map.values())

    @property
    def init_seg_name(self) -> str:
        return "init-stream$RepresentationID$.$ext$"

    @property
    def media_seg_name(self) -> str:
        return "chunk-stream$RepresentationID$-$Number%05d$.$ext$"


class DASHConverter(AudioConverter):
    codec_bitrate_map: dict[str, list[int]] = {}
    extras: dict = {}

    @override
    def manifest_path(self) -> str:
        return f"{self.song_uuid}.mpd"

    def ffmpeg_args(self) -> str:
        pass


class HLSConverter(AudioConverter):
    @override
    def manifest_path(self) -> str:
        return f"{self.song_uuid}.m3u8"

    def ffmpeg_args(self) -> str:
        # Implement HLS-specific ffmpeg arguments
        pass
