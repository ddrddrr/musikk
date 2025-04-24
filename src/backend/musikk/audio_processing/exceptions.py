class ConversionError(Exception):
    pass


class InvalidFileType(ConversionError):
    pass


class MaxSizeExceeded(ConversionError):
    pass
