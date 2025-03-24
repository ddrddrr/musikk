import os

from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.db import models

from src.backend.musikk.models import BaseModel


def avatar_path(instance, filename):
    return os.path.join(settings.MEDIA_ROOT, "users", "avatars", str(instance.uuid))


class BaseUser(BaseModel, AbstractUser):
    email = models.CharField(unique=True)

    first_name = models.CharField(blank=True, default="")
    last_name = models.CharField(blank=True, default="")
    display_name = models.CharField()
    avatar = models.ImageField(upload_to=avatar_path, max_length=255)

    is_admin = models.BooleanField(default=False)
