from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model

from streaming.models import StreamingProfile

User = get_user_model()


@receiver(post_save, sender=User)
def create_streaming_profile_for_user(sender, instance, created, **kwargs):
    if created:
        StreamingProfile.objects.create_for_user(instance)
