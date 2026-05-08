import shutil

from django.core.management.base import BaseCommand
from django.db import transaction
from notifications.models import (
    ChatMessageNotification,
    FollowerNotification,
    ReplyNotification,
)
from social.models.chat import Chat, ChatMember
from social.models.publication import Publication
from users.models import BaseUser
from users.models.connections import UserFollow

from streaming.management.constants import DEFAULT_GENERATED_AUDIO_DIR
from streaming.models import BaseSong, Collection


class Command(BaseCommand):
    help = "Clear all sample data created by initmodels"

    def handle(self, *args, **options):
        with transaction.atomic():
            ChatMessageNotification.objects.all().delete()
            FollowerNotification.objects.all().delete()
            ReplyNotification.objects.all().delete()
            ChatMember.objects.all().delete()
            Chat.objects.all().delete()
            Publication.objects.all().delete()
            UserFollow.objects.all().delete()
            # BaseSong.delete() cleans up audio files on disk
            for s in BaseSong.objects.all():
                s.delete()
            Collection.objects.all().delete()
            BaseUser.objects.all().delete()

        if DEFAULT_GENERATED_AUDIO_DIR.exists():
            shutil.rmtree(DEFAULT_GENERATED_AUDIO_DIR)

        self.stdout.write("Data cleared")
