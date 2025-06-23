from django.db.models.signals import post_save
from django.dispatch import receiver

from users.models import BaseUser, BaseProfile


@receiver(post_save, sender=BaseUser)
def init_base_profile(sender, **kwargs):
    if not kwargs.get("created", False):
        return

    BaseProfile.objects.create(user=kwargs["instance"])
