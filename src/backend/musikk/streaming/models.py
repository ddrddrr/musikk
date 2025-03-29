from base.models import BaseModel
from streaming.songs import *
from streaming.song_collections import *
from streaming.song_queue import *


# TODO: mb change to contettype relation instead of child classes?
class Stream(BaseModel):
    class Meta:
        abstract = True

    user = models.ForeignKey(
        "users.StreamingUser", on_delete=models.SET_NULL, null=True
    )


class SongStream(Stream):
    song = models.ForeignKey(BaseSong, on_delete=models.CASCADE, related_name="streams")


class SongCollectionStream(Stream):
    song_collection = models.ForeignKey(
        SongCollection, on_delete=models.CASCADE, related_name="streams"
    )
