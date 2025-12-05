from django.contrib.auth.base_user import BaseUserManager
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models
from django.utils.crypto import get_random_string

from base.models import BaseModel
from musikk.utils.paths import image_path


def default_display_name():
    return get_random_string(12)


class UserManager(BaseUserManager):
    def create_user(self, email, password, **kwargs):
        if not email:
            raise ValueError("The `email` is required.")
        email = self.normalize_email(email)
        user = self.model(email=email, **kwargs)
        user.set_password(password)
        user.save()
        return user

    def create_superuser(self, email, password, **kwargs):
        kwargs["is_staff"] = True
        kwargs["is_superuser"] = True
        return self.create_user(email=email, password=password, **kwargs)


class BaseUser(BaseModel, AbstractBaseUser, PermissionsMixin):
    REQUIRED_FIELDS = []
    USERNAME_FIELD = "email"

    email = models.EmailField(unique=True)
    display_name = models.CharField(max_length=50, default=default_display_name)
    bio = models.TextField(max_length=255, default="")
    avatar = models.ImageField(
        upload_to=image_path, max_length=255, blank=True, null=True
    )
    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    @property
    def friends(self) -> models.QuerySet["BaseUser"]:
        return (
            BaseUser.objects.filter(
                followed_users__from_user=self,  # us
                followers__to_user=self,  # others
            )
            .exclude(pk=self.pk)
            .distinct()
        )

    def __str__(self):
        return self.email

    objects = UserManager()
