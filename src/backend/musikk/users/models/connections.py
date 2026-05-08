from django.db import models
from base.models import BaseModel


class UserFollow(BaseModel):
    from_user = models.ForeignKey(
        "users.BaseUser",
        on_delete=models.CASCADE,
        related_name="followed_users",
    )
    to_user = models.ForeignKey(
        "users.BaseUser",
        on_delete=models.CASCADE,
        related_name="followers",
    )

    class Meta:
        unique_together = ("from_user", "to_user")
