from django.apps import AppConfig


class StreamingConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "streaming"

    def ready(self):
        from streaming import checks  # noqa: F401
        from streaming.audio.upload_files import create_upload_dirs
        from streaming.models import signals  # noqa: F401

        create_upload_dirs()
