from base.models import BaseModel
from django.db import models

from streaming.models.collections import Collection
from streaming.models.songs import CollectionSong


# TODO: if the user has a collection in context (and e.g. song is playing) and they delete a song from somewhere in the end
# and then click the second song manually (in the collection window)
# should the deleted song reappear?
class CollectionCursor(BaseModel):
    """Tracks where playback is inside the currently selected collection.

    `cursor` holds the `CollectionSong.position` of the last song
    that played, or `-1` if nothing has played yet. This makes the
    next-song query a simple `position__gt=cursor`.
    """

    collection = models.ForeignKey(
        "streaming.Collection",
        null=True,
        default=None,
        on_delete=models.SET_NULL,
        related_name="+",
    )
    # we use indices instead of ids because it makes deletion logic easier
    # and db queries cheaper
    cursor = models.IntegerField(default=-1)

    def advance(self) -> CollectionSong | None:
        if not self.collection:
            return None
        next_song = (
            CollectionSong.objects.filter(
                collection=self.collection,
                position__gt=self.cursor,
            )
            .order_by("position")
            .first()
        )
        if next_song:
            self.cursor = next_song.position
            self.save()
            return next_song
        return None

    def setup(self, collection: Collection, start_position: int = -1) -> None:
        self.collection = collection
        self.cursor = start_position
        self.save()

    def window(self, limit: int = 50) -> list[CollectionSong]:
        if not self.collection:
            return []
        return list(
            CollectionSong.objects.filter(
                collection=self.collection,
                position__gt=self.cursor,
            )
            .order_by("position")
            .select_related("song")[:limit]
        )
