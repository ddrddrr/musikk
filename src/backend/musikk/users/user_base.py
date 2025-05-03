from django.contrib.auth.base_user import BaseUserManager
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models
from django.urls.base import reverse
from django.utils.crypto import get_random_string

from base.models import BaseModel
from musikk.utils import image_path
from users.utils import password_reset_token_generator


def get_display_name(length=12):
    return get_random_string(length)


class UserManager(BaseUserManager):
    def create_user(self, email, password, **kwargs):
        if not email:
            raise ValueError("The Email must be set")
        email = self.normalize_email(email)
        user = self.model(email=email, **kwargs)
        user.set_password(password)
        user.save()
        return user

    def create_superuser(self, email, password, **kwargs):
        kwargs["is_admin"] = True
        kwargs["is_superuser"] = True
        return self.create_user(email=email, password=password, **kwargs)


class BaseUser(BaseModel, AbstractBaseUser, PermissionsMixin):
    REQUIRED_FIELDS = []
    USERNAME_FIELD = "email"

    email = models.EmailField(unique=True)
    display_name = models.CharField(max_length=50, default=get_display_name)
    bio = models.TextField(max_length=2000, default="")
    # TODO: change max len, add max size
    avatar = models.ImageField(
        upload_to=image_path, max_length=255, blank=True, null=True
    )
    is_admin = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    def get_password_reset_api_url(self) -> str:
        token = password_reset_token_generator.make_token(self)
        api_reset_url = reverse(
            f"api:v1:users:reset-password",
            kwargs={"uuid": self.uuid, "token": token},
        )
        return api_reset_url

    def __str__(self):
        return self.email

    objects = UserManager()
