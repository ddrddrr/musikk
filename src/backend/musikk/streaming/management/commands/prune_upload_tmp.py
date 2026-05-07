import time
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Delete upload temp files older than N hours from settings.UPLOAD_TMP_DIR"

    def add_arguments(self, parser):
        parser.add_argument(
            "--older-than-hours",
            type=int,
            default=24,
            help="Only prune files older than N hours (by mtime). Default: 24.",
        )

    def handle(self, *args, **options):
        upload_tmp_dir = Path(settings.UPLOAD_TMP_DIR)
        if not upload_tmp_dir.exists():
            self.stdout.write(
                f"Directory {upload_tmp_dir} does not exist, nothing to prune"
            )
            return

        delete_date = time.time() - options["older_than_hours"] * 3600
        for entry in upload_tmp_dir.iterdir():
            try:
                if entry.is_file() and entry.stat().st_mtime < delete_date:
                    entry.unlink()
                    self.stdout.write(f"pruned {entry}")
            except OSError as e:
                self.stderr.write(f"failed to prune {entry}: {e}")

        self.stdout.write("files deleted successfully")
