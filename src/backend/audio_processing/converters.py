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

    def construct_ffmpeg_command(self) -> str:
        instruction_list = [
            "-map 0",
            "-c:a",
            self.encoder,
            f"-f {self.protocol}",
        ]
        instruction_list.extend(self.extras)

        base_command = " ".join(instruction_list)
        if not self.bitrates:
            return base_command

        return " ".join(f"{base_command} b:a {bitrate}" for bitrate in self.bitrates)


FLAC_CONVERTER = AudioConverter("flac", "dash")
OPUS_CONVERTER = AudioConverter("libopus", "dash").set_bitrates([96, 160, 320])
AACHEv2_CONVERTER = \
    (AudioConverter("libfdk_aac", "dash")
     .set_bitrates([24])
     .add_extra("-profile aac_he_v2"))
