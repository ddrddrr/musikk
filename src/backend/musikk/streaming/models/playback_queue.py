from decimal import Decimal

from base.models import BaseModel
from django.db import models, transaction

from streaming.models.collections import Collection
from streaming.models.songs import CollectionSong


class SourceType(models.TextChoices):
    SONG = "song", "Song"
    COLLECTION = "collection", "Collection"


# not using GenericRelations as they complicate the logic -> it is not worth it when we have only
# two possible item types that could be added to the Queue
# can be implemented in the future if other item types will be supported by the Queue
class QueueSource(BaseModel):
    """A queue entry that has not become a `QueueItem` yet.

    A song source turns into one item, then deletes itself.
    A collection source produces up to `FILL_BATCH` items per refill, and keeps going
    across refills until the collection ends; `collection_cursor` tracks how far it is now.
    We keep the source around instead of
    expanding it up front, so the queue can take a long collection
    without writing thousands of rows at once.
    """

    queue = models.ForeignKey(
        "streaming.PlaybackQueue",
        on_delete=models.CASCADE,
        related_name="+",
    )
    source_type = models.CharField(max_length=16, choices=SourceType.choices)

    collection_song = models.ForeignKey(
        "streaming.CollectionSong",
        null=True,
        on_delete=models.CASCADE,
        related_name="+",
    )

    collection = models.ForeignKey(
        "streaming.Collection",
        null=True,
        on_delete=models.CASCADE,
        related_name="+",
    )
    collection_cursor = models.IntegerField(default=-1)

    class Meta:
        ordering = ("date_added",)


class QueueItem(BaseModel):
    """An entry in a `PlaybackQueue`.

    `position` sets the order of the items. An append takes
    `next_item_position`, which then grows by `POSITION_GAP`, and
    `push_front` takes the first position minus `POSITION_GAP`.
    So adding an item never moves the other items.
    Sort order and the `(queue, position)` index both use it, so callers
    should set positions through `PlaybackQueue`, not by hand.
    """

    queue = models.ForeignKey(
        "streaming.PlaybackQueue",
        on_delete=models.CASCADE,
        related_name="+",
    )
    position = models.DecimalField(max_digits=24, decimal_places=12)
    collection_song = models.ForeignKey(
        "streaming.CollectionSong",
        on_delete=models.CASCADE,
        related_name="+",
    )

    class Meta:
        ordering = ("position",)
        indexes = [
            models.Index(fields=["queue", "position"]),
        ]


POSITION_GAP = Decimal("1000")
REFILL_THRESHOLD = 30
FILL_BATCH = 20


class PlaybackQueue(BaseModel):
    """Items the user added on top of the current `CollectionCursor`.

    The queue has priority over CollectionCursor: "play next"
    takes from here first, and only falls back
    to the context when the queue is empty.

    There are two kinds of rows. `QueueItem` rows are the real,
    ordered entries used by `pop_first` and `window`.
    `QueueSource` rows are kept in storage and not yet expanded;
    `_fill` turns them into items when the item count drops below
    `REFILL_THRESHOLD`, adding at most `FILL_BATCH` per cycle.

    `next_item_position` is the append position used by
    `_calculate_append_position`. All inserts go through this class,
    so the position scheme and refill rules stay in one place.
    """

    next_item_position = models.DecimalField(
        max_digits=24,
        decimal_places=12,
        default=POSITION_GAP,
    )

    def append(self, obj: CollectionSong | Collection) -> QueueSource:
        if isinstance(obj, CollectionSong):
            return self.append_song(obj)
        if isinstance(obj, Collection):
            return self.append_collection(obj)
        raise TypeError(f"Cannot append {type(obj)} to Queue")

    def insert_song(self, song: CollectionSong, position: Decimal) -> QueueItem:
        with transaction.atomic():
            item = QueueItem.objects.create(
                queue=self,
                collection_song=song,
                position=position,
            )
            if position >= self.next_item_position:
                self.next_item_position = position + POSITION_GAP
                self.save()
            return item

    def push_front(self, song: CollectionSong) -> QueueItem:
        first = QueueItem.objects.filter(queue=self).order_by("position").first()
        position = first.position - POSITION_GAP if first else self.next_item_position
        return self.insert_song(song, position)

    def append_song(self, song: CollectionSong) -> QueueSource:
        with transaction.atomic():
            source = QueueSource.objects.create(
                queue=self,
                source_type=SourceType.SONG,
                collection_song=song,
            )
            self._fill()
            return source

    def append_collection(self, collection: Collection) -> QueueSource:
        with transaction.atomic():
            source = QueueSource.objects.create(
                queue=self,
                source_type=SourceType.COLLECTION,
                collection=collection,
                collection_cursor=-1,
            )
            self._fill()
            return source

    def remove(self, item: QueueItem) -> None:
        if not item.pk:
            raise ValueError("Item has already been deleted")
        with transaction.atomic():
            item.delete()
            self._fill()

    def pop_first(self) -> CollectionSong | None:
        with transaction.atomic():
            first = QueueItem.objects.filter(queue=self).order_by("position").first()
            if not first:
                return None
            song = first.collection_song
            first.delete()
            self._fill()
            return song

    def pop_until(self, position: Decimal) -> None:
        with transaction.atomic():
            QueueItem.objects.filter(queue=self, position__lte=position).delete()
            self._fill()

    def clear(self) -> None:
        with transaction.atomic():
            QueueItem.objects.filter(queue=self).delete()
            QueueSource.objects.filter(queue=self).delete()
            self.next_item_position = POSITION_GAP
            self.save()

    def window(self, cap: int = 50) -> list[QueueItem]:
        return list(
            QueueItem.objects.filter(queue=self)
            .order_by("position")
            .select_related("collection_song", "collection_song__song")[:cap]
        )

    def _fill(self, n: int = FILL_BATCH) -> None:
        if QueueItem.objects.filter(queue=self).count() >= REFILL_THRESHOLD:
            return

        with transaction.atomic():
            for source in list(
                QueueSource.objects.filter(queue=self).order_by("date_added")
            ):
                if n <= 0:
                    break
                n -= self._fill_from_source(source, n)

            self.save()

    def _fill_from_source(self, source: QueueSource, limit: int = FILL_BATCH) -> int:
        if source.source_type == SourceType.SONG:
            return self._process_song_source(source)
        return self._process_collection_source(source, limit)

    def _process_song_source(self, source: QueueSource) -> int:
        consumed = 0
        if source.collection_song:
            QueueItem.objects.create(
                queue=self,
                collection_song=source.collection_song,
                position=self._calculate_append_position(),
            )
            consumed = 1
        source.delete()
        return consumed

    def _process_collection_source(self, source: QueueSource, limit: int) -> int:
        fetched = list(
            CollectionSong.objects.filter(
                collection=source.collection,
                position__gt=source.collection_cursor,
            )
            .order_by("position")
            .select_related("song")[: limit + 1]
        )

        songs = fetched[:limit]
        items = []
        for cs in songs:
            items.append(
                QueueItem(
                    queue=self,
                    collection_song=cs,
                    position=self._calculate_append_position(),
                )
            )
            source.collection_cursor = cs.position
        QueueItem.objects.bulk_create(items)

        if songs:
            source.save()

        if not len(fetched) > limit:
            source.delete()

        return len(items)

    def _calculate_append_position(self) -> Decimal:
        pos = self.next_item_position
        self.next_item_position += POSITION_GAP
        return pos
