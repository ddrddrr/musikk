class FFMPEGWrapper:
    def __init__(self):
        self.converters: list[AudioConverter] = []

    def add_converter(self, converted: AudioConverter) -> bool:
        pass

    def convert_song(self, song: bytes) -> dict[str, str]:
        """Returns manifest paths - {manifest_format: path}"""
        pass
