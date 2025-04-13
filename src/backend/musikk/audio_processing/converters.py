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

    def set_extras(self, extras: list[str]) -> Self:
        self.extras = extras
        return self

    def construct_ffmpeg_command(self, channel_input: int) -> list[list[str]]:
        # TODO: change data structures, so there is no clunky indexing on lists
        base_command = [
            "-map",
            "0:a",
            "-c:a:0",
            self.encoder,
        ]
        base_command.extend(self.extras)
        if not self.bitrates:
            return [base_command]

        commands = []
        for bitrate in self.bitrates:
            base_command[2] = base_command[2][:-1] + str(channel_input)
            commands.append(base_command + ["-b:a", f"{bitrate}k"])
            channel_input += 1
        return commands


FLAC_CONVERTER = AudioConverter("flac", "dash")
OPUS_CONVERTER = AudioConverter("libopus", "dash").set_bitrates([96, 160, 256])
AACHEv2_CONVERTER = (
    AudioConverter("libfdk_aac", "dash")
    .set_bitrates([24])
    .set_extras(["-profile", "aac_he_v2"])
)
