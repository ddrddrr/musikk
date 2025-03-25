from pathlib import Path
from typing import Self


class AudioConverter:
    def __init__(self, encoder: str, protocol: str):
        self.encoder = encoder
        self.protocol = protocol
        self.bitrates: list[int] = []
        self.extras: list[str] = []

    def set_bitrates(self, bitrates: list[int]) -> Self:
        self.bitrates = bitrates
        return self

    def add_extra(self, extra: str) -> Self:
        self.extras.append(extra)
        return self

    def construct_ffmpeg_command(self, song_content_path: Path) -> list[list[str]]:
        segments_dir = self._prepare_segment_dirs(song_content_path)
        # Base command for each bitrate
        base_command = [
            "-map", "0",
            "-c:a", self.encoder,
            f"-f", self.protocol,
            f"-init_seg_name", self.init_seg_name(segments_dir),
            f"-media_seg_name", self.media_seg_name(segments_dir),
        ]
        base_command.extend(self.extras)

        if self.bitrates:
            return [base_command + [f"b:a {bitrate}"] for bitrate in self.bitrates]

        return [base_command]

    def init_seg_name(self, segments_dir: Path):
        return f"{segments_dir}/init-stream$RepresentationID$.$ext$"

    def media_seg_name(self, segments_dir: Path):
        return f"{segments_dir}/chunk-stream$RepresentationID$-$Number%05d$.$ext$"

    def _prepare_segment_dirs(self, song_content_path: Path) -> Path:
        segments_dir = song_content_path / "segments"
        segments_dir.mkdir(parents=True, exist_ok=True)
        return segments_dir


FLAC_CONVERTER = AudioConverter("flac", "dash")
OPUS_CONVERTER = AudioConverter("libopus", "dash").set_bitrates([96, 160, 320])
AACHEv2_CONVERTER = \
    (AudioConverter("libfdk_aac", "dash")
     .set_bitrates([24])
     .add_extra("-profile aac_he_v2"))
