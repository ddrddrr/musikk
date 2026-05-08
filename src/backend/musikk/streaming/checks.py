import shutil
from pathlib import Path

from django.conf import settings
from django.core.checks import Error, Tags, register

REQUIRED_BINARIES = [
    ("ffmpeg", settings.FFMPEG_BIN),
    ("ffprobe", settings.FFPROBE_BIN),
    ("shaka-packager", settings.SHAKA_PACKAGER_BIN),
]


@register(Tags.compatibility)
def check_binary_dependencies(**kwargs) -> list[Error]:
    errors = []
    for name, path in REQUIRED_BINARIES:
        # on PATH or an existing file
        if shutil.which(path) or Path(path).is_file():
            continue
        errors.append(Error(f"{name} binary not found at '{path}'."))
    return errors
