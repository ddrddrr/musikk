from django.contrib.auth.models import AbstractUser
from django.db import models

from base.models import BaseModel
from musikk.utils import image_path


class BaseUser(BaseModel, AbstractUser):
    email = models.CharField(unique=True)

    first_name = models.CharField(blank=True, default="")
    last_name = models.CharField(blank=True, default="")
    display_name = models.CharField()
    avatar = models.ImageField(upload_to=image_path, max_length=255)

    is_admin = models.BooleanField(default=False)
