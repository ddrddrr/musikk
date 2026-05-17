from base.models import BaseModel
from django.contrib.auth.base_user import BaseUserManager
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models
from django.utils.crypto import get_random_string
from utils.paths import deafult_image_path


def default_display_name():
    return get_random_string(12)


class UserRole(models.TextChoices):
    BASE = "base", "Base"
    ARTIST = "artist", "Artist"


class UserManager(BaseUserManager):
    def create_user(self, email, password, **kwargs):
        if not email:
            raise ValueError("The `email` is required.")
        email = self.normalize_email(email).lower()
        user = self.model(email=email, **kwargs)
        user.set_password(password)
        user.save()
        return user

    def create_superuser(self, email, password, **kwargs):
        kwargs.setdefault("is_staff", True)
        kwargs.setdefault("is_superuser", True)
        kwargs.setdefault("role", UserRole.BASE)
        return self.create_user(email=email, password=password, **kwargs)


class BaseUser(BaseModel, AbstractBaseUser, PermissionsMixin):
    REQUIRED_FIELDS = []
    USERNAME_FIELD = "email"

    email = models.EmailField(unique=True)
    display_name = models.CharField(max_length=50, default=default_display_name)
    bio = models.TextField(max_length=2000, default="")
    # TODO: what should be the actual max len?
    avatar = models.ImageField(
        upload_to=deafult_image_path, max_length=255, blank=True, null=True
    )

    role = models.CharField(
        max_length=16,
        choices=UserRole.choices,
        default=UserRole.BASE,
        db_index=True,
    )

    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    @property
    def is_artist(self) -> bool:
        return self.role == UserRole.ARTIST

    @property
    def friends(self) -> models.QuerySet["BaseUser"]:
        return (
            BaseUser.objects.filter(
                followers__from_user=self,  # self -> X
                followed_users__to_user=self,  # X -> self
            )
            .exclude(pk=self.pk)
            .distinct()
        )

    @property
    def following(self) -> models.QuerySet["BaseUser"]:
        return BaseUser.objects.filter(followers__from_user=self)

    def __str__(self):
        return self.display_name

    objects = UserManager()
