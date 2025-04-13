from uuid import uuid4

from django.contrib.auth.models import AbstractUser
from django.db import models
from django.urls.base import reverse

from base.models import BaseModel
from musikk.utils import image_path
from users.utils import password_reset_token_generator


class BaseUser(BaseModel, AbstractUser):
    REQUIRED_FIELDS = []
    USERNAME_FIELD = "email"

    email = models.EmailField(unique=True)

    first_name = models.CharField(blank=True, default="")
    last_name = models.CharField(blank=True, default="")
    display_name = models.CharField(default=uuid4)
    # TODO: change max len
    avatar = models.ImageField(
        upload_to=image_path, max_length=255, blank=True, null=True
    )
    is_admin = models.BooleanField(default=False)

    def get_password_reset_api_url(self) -> str:
        token = password_reset_token_generator.make_token(self)
        api_reset_url = reverse(
            f"api:v1:users:reset-password",
            kwargs={"uuid": self.uuid, "token": token},
        )
        return api_reset_url
