from base.exceptions import MusikkException


class AudioProcessingPipelineError(MusikkException):
    pass


class ProcessingTimeoutError(AudioProcessingPipelineError):
    pass
