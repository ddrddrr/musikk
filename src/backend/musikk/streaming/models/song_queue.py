from decimal import Decimal
from typing import overload

from base.models import BaseModel
from django.contrib.postgres.fields import ArrayField
from django.db import models, transaction

from streaming.models.collections import Collection
from streaming.models.songs import CollectionSong

POSITION_GAP = Decimal("1000")
REFILL_THRESHOLD = 30
FILL_BATCH = 20


class SourceType(models.TextChoices):
    SONG = "song", "Song"
    COLLECTION = "collection", "Collection"


# not using GenericRelations as they complicate the logic -> it is not worth it when we have only
# two possible item types that could be added to the Queue
# can be implemented in the future if other item types will be supported by the Queue
class QueueSource(BaseModel):
    """
    A deferred queue entry that has not been turned into a `QueueItem`
    yet. A song source yields one item and then deletes itself. A
    collection source yields up to `FILL_BATCH` items per refill cycle
    and keeps going across cycles until its collection runs out,
    tracking progress in `collection_cursor`. Keeping the source around
    instead of expanding it up front is how the queue can accept a long
    collection without writing thousands of rows at once.
    """

    queue = models.ForeignKey(
        "streaming.SongQueue",
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
    """
    A real, materialized entry in a `SongQueue`. `position` is a
    high-precision decimal so a new item can be slotted between two
    neighbours by taking their midpoint, without renumbering anything
    else. Ordering and the `(queue, position)` index both depend on
    it, so callers should always go through `SongQueue` instead of
    setting `position` directly.
    """

    queue = models.ForeignKey(
        "streaming.SongQueue",
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


# TODO: if the user has a collection in context (and e.g. song is playing) and they delete a song from somewhere in the end
# and then click the second song manually (in the collection window)
# should the deleted song reappear?
class PlaybackContext(BaseModel):
    """
    Tracks where playback is within the current collection. `cursor`
    holds the `CollectionSong.position` of the last song that played,
    or `-1` if nothing has played yet, which makes the next-song lookup
    a simple `position__gt=cursor`. `skip_indices` holds positions the
    user pulled out of the context (removed, or moved into the queue).
    Without it those songs would come back on the next `advance()`
    because the underlying rows still exist. Positions are used instead
    of ids because the resulting queries are cheaper and deletions only
    need to compare against the cursor.
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
    skip_indices = ArrayField(
        models.IntegerField(),
        default=list,
        blank=True,
    )

    def advance(self) -> CollectionSong | None:
        if not self.collection:
            return None
        next_song = (
            CollectionSong.objects.filter(
                collection=self.collection,
                position__gt=self.cursor,
            )
            .exclude(position__in=self.skip_indices)
            .order_by("position")
            .first()
        )
        if next_song:
            self.cursor = next_song.position
            self.skip_indices = [i for i in self.skip_indices if i > self.cursor]
            self.save()
            return next_song
        return None

    def skip(self, position: int) -> None:
        if position > self.cursor:
            self.skip_indices.append(position)
            self.save()

    def setup(self, collection: Collection, start_position: int = -1) -> None:
        self.collection = collection
        self.cursor = start_position
        self.skip_indices = []
        self.save()

    def window(self, limit: int = 50) -> list[CollectionSong]:
        if not self.collection:
            return []
        return list(
            CollectionSong.objects.filter(
                collection=self.collection,
                position__gt=self.cursor,
            )
            .exclude(position__in=self.skip_indices)
            .order_by("position")
            .select_related("song")[:limit]
        )


# TODO: with the curr precision of the position on repeated inserts in the same position we can
# eventually reach the situation where the positions will become equal due to the lack of precision
class SongQueue(BaseModel):
    """
    User-added items layered on top of the current `PlaybackContext`.
    The queue always wins: `PlayerState.advance` pops from here first
    and only falls back to the context once the queue is empty.

    Items come in two flavours. `QueueItem` rows are the real, ordered
    entries that `pop_first`, `window`, and `reorder` work with.
    `QueueSource` rows are deferred backing that `_fill` turns into
    items whenever the count drops below `REFILL_THRESHOLD`, adding at
    most `FILL_BATCH` per cycle. `next_item_position` is the append
    cursor used by `_calculate_append_position`. All inserts go through
    this class so the position scheme and refill rules stay in one
    place.
    """

    next_item_position = models.DecimalField(
        max_digits=24,
        decimal_places=12,
        default=POSITION_GAP,
    )

    def insert(
        self, obj: CollectionSong | Collection, position: Decimal | None = None
    ) -> QueueItem | QueueSource:
        if isinstance(obj, CollectionSong):
            return self.insert_song(obj, position)
        if isinstance(obj, Collection):
            return self.insert_collection(obj)
        raise TypeError(f"Cannot insert {type(obj)} into Queue")

    @overload
    def insert_song(self, song: CollectionSong, position: Decimal) -> QueueItem: ...
    @overload
    def insert_song(
        self, song: CollectionSong, position: None = None
    ) -> QueueSource: ...

    def insert_song(
        self, song: CollectionSong, position: Decimal | None = None
    ) -> QueueItem | QueueSource:
        with transaction.atomic():
            if position is not None:
                return self._insert_song_at_pos(song, position)

            source = QueueSource.objects.create(
                queue=self,
                source_type=SourceType.SONG,
                collection_song=song,
            )
            self._fill()
            return source

    def _insert_song_at_pos(self, song: CollectionSong, position: Decimal):
        item = QueueItem.objects.create(
            queue=self,
            collection_song=song,
            position=position,
        )
        if position >= self.next_item_position:
            self.next_item_position = position + POSITION_GAP
            self.save()
        return item

    def insert_collection(self, collection: Collection) -> QueueSource:
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

    def reorder(
        self,
        item: QueueItem,
        before: QueueItem | None = None,
        after: QueueItem | None = None,
    ) -> None:
        with transaction.atomic():
            if before and after:
                item.position = (before.position + after.position) / 2
            elif before:
                item.position = before.position + POSITION_GAP
            elif after:
                item.position = after.position - POSITION_GAP

            item.save()

            if item.position >= self.next_item_position:
                self.next_item_position = item.position + POSITION_GAP
                self.save()

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


class PlayerState(BaseModel):
    """
    Owns the playback order. The job is split three ways: `PlayerState`
    holds the currently-playing song and the history cursor,
    `SongQueue` holds items the user explicitly added, and
    `PlaybackContext` is whichever collection is playing through (for
    example after the user hit play on a playlist).

    `advance` looks at the queue first and only falls back to
    `context.advance()` once the queue is empty, so user-enqueued items
    always beat the context. If both are empty playback stops. `prev`
    steps back through history and pushes the current song to the
    front of the queue, so pressing forward again returns to it.
    """

    current_collection_song = models.ForeignKey(
        "streaming.CollectionSong",
        null=True,
        default=None,
        on_delete=models.SET_NULL,
        related_name="+",
    )
    history_cursor = models.PositiveIntegerField(default=0)
    queue = models.OneToOneField(
        "streaming.SongQueue",
        on_delete=models.CASCADE,
    )
    context = models.OneToOneField(
        "streaming.PlaybackContext",
        on_delete=models.CASCADE,
    )

    def play_song(self, collection_song: CollectionSong) -> None:
        with transaction.atomic():
            self._transition_to(collection_song)
            pos = (
                collection_song.position if collection_song.position is not None else -1
            )
            self.context.setup(collection_song.collection, pos)
            self.save()

    def play_collection(self, collection: Collection) -> None:
        first_song = (
            CollectionSong.objects.filter(collection=collection)
            .order_by("position")
            .first()
        )
        if not first_song:
            return
        self.play_song(first_song)

    def advance(self) -> CollectionSong | None:
        with transaction.atomic():
            song = self.queue.pop_first()
            if song:
                self._transition_to(song)
                self.save()
                return self.current_collection_song

            next_song = self.context.advance()
            if next_song:
                self._transition_to(next_song)
                self.save()
                return self.current_collection_song

            self._transition_to(None)
            self.save()
            return None

    def choose_queue_song(self, item: QueueItem) -> CollectionSong | None:
        with transaction.atomic():
            self.queue.pop_until(item.position)
            self._transition_to(item.collection_song)
            self.save()
            return self.current_collection_song

    def choose_context_song(self, collection_song: CollectionSong) -> CollectionSong:
        with transaction.atomic():
            self._transition_to(collection_song)
            if collection_song.position is not None:
                self.context.cursor = collection_song.position
                # removes redundant indices
                self.context.skip_indices = [
                    i for i in self.context.skip_indices if i > self.context.cursor
                ]
                self.context.save()
            self.save()
            return self.current_collection_song

    def move_from_context_to_queue(
        self, collection_song: CollectionSong, position: Decimal
    ) -> QueueItem:
        with transaction.atomic():
            item = self.queue.insert_song(collection_song, position)
            if collection_song.position is not None:
                self.context.skip(collection_song.position)
            return item

    def prev(self) -> CollectionSong | None:
        with transaction.atomic():
            history = self.streamingprofile.history
            entry = (
                CollectionSong.objects.filter(collection=history)
                .order_by("-position")[self.history_cursor : self.history_cursor + 1]
                .first()
            )

            if not entry:
                return None

            if self.current_collection_song:
                first = (
                    QueueItem.objects.filter(queue=self.queue)
                    .order_by("position")
                    .first()
                )
                pos = (
                    (first.position - POSITION_GAP)
                    if first
                    else self.queue._calculate_append_position()
                )
                QueueItem.objects.create(
                    queue=self.queue,
                    collection_song=self.current_collection_song,
                    position=pos,
                )

            self.current_collection_song = entry
            self.history_cursor += 1
            self.save()
            return self.current_collection_song

    def clear(self) -> None:
        """
        Clears the queue and resets history cursor.
        The history is cleared because prev() pushes
        songs into the queue and clearing without rewinding the cursor would
        make those songs unreachable.
        """
        with transaction.atomic():
            self.queue.clear()
            self.history_cursor = 0
            self.save()

    def is_empty(self) -> bool:
        return (
            self.current_collection_song is None
            and not QueueItem.objects.filter(queue=self.queue).exists()
        )

    # TODO: not sure yet when to add to history - on switch to or on switch from
    def _transition_to(self, song: CollectionSong | None) -> None:
        self._add_to_history()
        self.current_collection_song = song
        self.history_cursor = 0

    def _add_to_history(self) -> None:
        if not self.current_collection_song:
            return
        history = self.streamingprofile.history
        CollectionSong.objects.create(
            collection=history,
            song=self.current_collection_song.song,
        )
