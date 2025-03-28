from django.db import models

from musikk.models import BaseModel
from streaming.songs import *
from streaming.song_collections import *
from streaming.song_queue import *


class Stream(BaseModel):
    class Meta:
        abstract = True

    user = models.ForeignKey("StreamingUser", on_delete=models.SET_NULL)


class SongStream(Stream):
    song = models.ForeignKey(BaseSong, on_delete=models.CASCADE)


class SongCollectionStream(Stream):
    song_collection = models.ForeignKey(SongCollection, on_delete=models.CASCADE)
