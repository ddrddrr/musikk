from django.conf import settings
from django.db import transaction
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.apps import apps

from streaming.models import StreamingProfile

User = apps.get_model(settings.AUTH_USER_MODEL)


@receiver(post_save, sender=User)
def create_streaming_profile_for_user(sender, instance, created, **kwargs):
    if not created:
        return

    StreamingProfile.objects.create_for_user(instance)
