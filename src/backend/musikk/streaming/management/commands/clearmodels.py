from django.core.management.base import BaseCommand
from django.db import transaction

from streaming.models import (
    BaseSong,
    Collection,
)
from users.models import BaseUser


class Command(BaseCommand):
    def handle(self, *args, **options):
        with transaction.atomic():
            for s in BaseSong.objects.all():
                s.delete()
            BaseUser.objects.all().delete()
            Collection.objects.all().delete()
