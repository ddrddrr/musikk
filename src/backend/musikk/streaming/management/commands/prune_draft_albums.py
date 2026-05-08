from datetime import timedelta

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from streaming.models import BaseSong, Collection
from streaming.models.collections import CollectionType


class Command(BaseCommand):
    help = "Delete album collections that are still in a draft state (alongside related songs)"

    def add_arguments(self, parser):
        parser.add_argument(
            "--older-than-days",
            type=int,
            default=1,
            help="Only prune drafts older than N days (by date_added). Default: 1.",
        )

    def handle(self, *args, **options):
        candidates = Collection.objects.filter(
            type=CollectionType.ALBUM,
            draft=True,
            date_added__lt=(
                timezone.now() - timedelta(days=options["older_than_days"])
            ),
        )

        for collection in candidates:
            song_uuids = list(
                BaseSong.objects.filter(collectionsongs__collection=collection)
                .values_list("uuid", flat=True)
                .distinct()
            )
            self.stdout.write(
                f"album={collection.uuid} title={collection.title!r} "
                f"date_added={collection.date_added.isoformat()} "
                f"songs={len(song_uuids)}"
            )

            with transaction.atomic():
                for song in BaseSong.objects.filter(uuid__in=song_uuids):
                    song.delete()
                collection.delete()
