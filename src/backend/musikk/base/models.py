from uuid import uuid4
from django.db import models


class BaseModel(models.Model):
    class Meta:
        abstract = True

    uuid = models.UUIDField(default=uuid4, editable=False, unique=True, db_index=True)
    date_added = models.DateTimeField(auto_now_add=True)
    date_modified = models.DateTimeField(auto_now=True)
