from pathlib import Path

from django.conf import settings

DEFAULT_GENERATED_AUDIO_DIR = Path(settings.BASE_DIR) / "samples" / "generated"
