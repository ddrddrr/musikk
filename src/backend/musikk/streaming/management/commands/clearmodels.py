from django.core.management.base import BaseCommand
from django.db import transaction

from streaming.models import BaseSong, SongCollection
from users.user_base import BaseUser


class Command(BaseCommand):

    def handle(self, *args, **options):
        with transaction.atomic():
            for s in BaseSong.objects.all():
                s.delete()
            BaseUser.objects.all().delete()
            SongCollection.objects.all().delete()
