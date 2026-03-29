from decimal import Decimal
from uuid import UUID

from django.contrib.postgres.fields import ArrayField
from django.core.exceptions import ObjectDoesNotExist
from django.db import models, transaction

from base.models import BaseModel
from streaming.models.collections import Collection
from streaming.models.songs import CollectionSong

POSITION_GAP = Decimal("1000")
REFILL_THRESHOLD = 30
FILL_BATCH = 20


class SourceType(models.TextChoices):
    SONG = "song", "Song"
    COLLECTION = "collection", "Collection"


class ItemOrigin(models.TextChoices):
    CONTEXT = "context", "Context"
    SOURCE = "source", "Source"
    USER = "user", "User"


# not using GenericRelations as they complicate the logic -> it is not worth it when we have only
# two possible item types that could be added to the Queue
# can be implemented in the future if other item types will be supported by the Queue
class QueueSource(BaseModel):
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
    origin = models.CharField(
        max_length=16,
        choices=ItemOrigin.choices,
        default=ItemOrigin.SOURCE,
    )

    class Meta:
        ordering = ("position",)
        indexes = [
            models.Index(fields=["queue", "position"]),
        ]


class SongQueue(BaseModel):
    """
    SongQueue is modeled as a lazily filled object with a length limit.

    Queue Context represents the currently playing Collection, e.g., if the User clicks on the play button
    of the `Liked Songs` collection, the `context_collection` would be set to it. The cursor (`context_cursor`)
    stores the CollectionSong.position of the last song consumed from that Collection. -1 means nothing has
    been consumed yet. Queries use `position__gt=cursor` to find the next song, so cursor=0 means "position 0
    was consumed, start from position 1." (QueueSource has `collection_cursor` for similar purposes)

    QueueItems represent items which should be rendered on the Frontend and can be manipulated with.

    Queue Sources represent items that were manually added by User on top of the current Context.
    If the currently playing Collection is `Liked Songs` and the User opens another
    Collection `MyPlaylist` and then clicks `Add To Queue` on some song inside it, it would become one
    of the Queue Sources (same for whole Collections). The Queue Source is then used to fill the Queue when there is
    empty space in the Queue.

    Filling is the process of converting Sources and Context into concrete QueueItems. It is lazy:
    `_refill()` only runs when the item count drops below REFILL_THRESHOLD and then creates up to
    FILL_BATCH new items. Sources are processed first (user-added content takes priority),
    then Context fills the remaining slots. This means the queue fluctuates between ~REFILL_THRESHOLD
    and ~REFILL_THRESHOLD+FILL_BATCH items, without adding entire collections upfront.

    `context_skip_indices` tracks positions of context songs the user explicitly deleted from the queue.
    Without it, deleted context songs would be re-processed on the next refill cycle. Example: playing a
    100-song collection, first 30 processed, user deletes the item at position 25. When the queue drops
    below the refill threshold and _refill() runs, position 25 is still ahead of the playback cursor and no
    longer in the existing items set -- so it would come back. `context_skip_indices` prevents that.

    Use-cases:
        - User clicks on Collection's play button -> set current context to the selected Collection, reset cursor.
        Queue sources stay unchanged.
        - User clicks on a Song inside a Collection -> set current context to the Song's Collection,
        cursor to the Song's position. Queue sources stay unchanged.
        - User clicks on a Queue Item inside the Queue Window -> if the Queue Item's Song came from the Queue Context,
        move Context's cursor to the Queue Item's Song position. Delete all the Queue Items before the selected one.
        Otherwise just delete all the Queue Items before the selected one (the Queue Item came from a Queue Source).
        - User deletes a Queue Item -> delete the Queue Item. If it came from context and is ahead of the cursor,
        add its position to context_skip_indices so it won't be re-processed.
        - User drags a Queue Item to another place:
            * To the top -> selected item position = first item position - POSITION_GAP
            * To the bottom -> selected item position = last item position + POSITION_GAP
            * Somewhere in the middle -> (prev item position + next item position) / 2
        - User clears the Queue:
            * Currently resets everything (context + items + sources).
            * May change to "clear overlays only" (keep context, remove user-added items/sources, refill).
        - User presses Play Previous button:
            * Once: history_cursor increments by 1, retrieves the last played song from history,
            pushes current song back to the front of the queue.
            * Multiple times: history_cursor keeps incrementing, walking back through history.
            Resets to 0 on choose()/next().
        - User adds to Queue an already existing Queue Item -> creates a second independent item, no dedup.
    """

    current_collection_song = models.ForeignKey(
        "streaming.CollectionSong",
        null=True,
        default=None,
        on_delete=models.SET_NULL,
        related_name="+",
    )
    context_collection = models.ForeignKey(
        "streaming.Collection",
        null=True,
        default=None,
        on_delete=models.SET_NULL,
        related_name="+",
    )
    context_cursor = models.IntegerField(default=-1)
    context_skip_indices = ArrayField(
        models.IntegerField(),
        default=list,
        blank=True,
    )
    next_item_position = models.DecimalField(
        max_digits=24,
        decimal_places=12,
        default=POSITION_GAP,
    )
    history_cursor = models.PositiveIntegerField(default=0)

    def choose(self, item_uuid: UUID) -> CollectionSong | None:
        with transaction.atomic():
            item = QueueItem.objects.get(queue=self, uuid=item_uuid)

            self._add_to_history()
            self._skip_context_items_below(item.position)

            QueueItem.objects.filter(queue=self, position__lte=item.position).delete()

            if (
                item.origin == ItemOrigin.CONTEXT
                and item.collection_song.position is not None
            ):
                self.context_cursor = item.collection_song.position

            self.current_collection_song = item.collection_song
            self.history_cursor = 0
            self.save()

            self._fill()
            return self.current_collection_song

    # TODO: rename
    def next(self) -> CollectionSong | None:
        first = QueueItem.objects.filter(queue=self).order_by("position").first()
        if first:
            return self.choose(first.uuid)
        return self._advance_context()

    def insert_song(
        self, song: CollectionSong, position: Decimal | None = None
    ) -> QueueItem | QueueSource:
        with transaction.atomic():
            if position is not None:
                item = QueueItem.objects.create(
                    queue=self,
                    collection_song=song,
                    position=position,
                    origin=ItemOrigin.USER,
                )
                if position >= self.next_item_position:
                    self.next_item_position = position + POSITION_GAP
                    self.save()
                return item

            item = QueueItem.objects.create(
                queue=self,
                collection_song=song,
                position=self._calculate_append_position(),
                origin=ItemOrigin.SOURCE,
            )
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

    def insert(
        self, obj: CollectionSong | Collection, position: Decimal | None = None
    ) -> QueueItem | QueueSource:
        if isinstance(obj, CollectionSong):
            return self.insert_song(obj, position)
        if isinstance(obj, Collection):
            return self.insert_collection(obj)
        raise TypeError(f"Cannot insert {type(obj)} into Queue")

    def remove(self, item_uuid: UUID) -> None:
        with transaction.atomic():
            item = QueueItem.objects.get(queue=self, uuid=item_uuid)

            if (
                item.origin == ItemOrigin.CONTEXT
                and item.collection_song.position is not None
            ):
                if item.collection_song.position > self.context_cursor:
                    self.context_skip_indices.append(item.collection_song.position)
                    self.save()

            item.delete()
            self._fill()

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
                    QueueItem.objects.filter(queue=self).order_by("position").first()
                )
                pos = (
                    (first.position - POSITION_GAP)
                    if first
                    else self._calculate_append_position()
                )
                QueueItem.objects.create(
                    queue=self,
                    collection_song=self.current_collection_song,
                    position=pos,
                    origin=ItemOrigin.USER,
                )

            self.current_collection_song = entry
            self.history_cursor += 1
            self.save()
            return self.current_collection_song

    def window(self, cap: int = 50) -> list[QueueItem]:
        return list(
            QueueItem.objects.filter(queue=self)
            .order_by("position")
            .select_related("collection_song", "collection_song__song")[:cap]
        )

    def play_song(self, collection_song: CollectionSong) -> None:
        with transaction.atomic():
            self._add_to_history()
            QueueItem.objects.filter(queue=self, origin=ItemOrigin.CONTEXT).delete()

            self.current_collection_song = collection_song
            self.context_collection = collection_song.collection
            self.context_cursor = (
                collection_song.position if collection_song.position is not None else -1
            )
            self.context_skip_indices = []
            self.history_cursor = 0
            self.save()

            self._fill()

    def play_collection(self, collection: Collection) -> None:
        first_song = (
            CollectionSong.objects.filter(collection=collection)
            .order_by("position")
            .first()
        )
        if not first_song:
            return

        self.play_song(first_song)

    def clear(self) -> None:
        with transaction.atomic():
            QueueItem.objects.filter(queue=self).delete()
            QueueSource.objects.filter(queue=self).delete()
            self.context_skip_indices = []
            self.next_item_position = POSITION_GAP
            self.history_cursor = 0
            self.save()
            self._fill()

    def reorder(
        self,
        item_uuid: UUID,
        before_uuid: UUID | None = None,
        after_uuid: UUID | None = None,
    ) -> None:
        with transaction.atomic():
            item = QueueItem.objects.get(queue=self, uuid=item_uuid)
            before = (
                QueueItem.objects.get(queue=self, uuid=before_uuid)
                if before_uuid
                else None
            )
            after = (
                QueueItem.objects.get(queue=self, uuid=after_uuid)
                if after_uuid
                else None
            )

            if before and after:
                item.position = (before.position + after.position) / 2
            elif before:
                item.position = before.position + POSITION_GAP
            elif after:
                item.position = after.position - POSITION_GAP

            item.save()

    def is_empty(self) -> bool:
        return (
            self.current_collection_song is None
            and not QueueItem.objects.filter(queue=self).exists()
        )

    def _advance_context(self) -> CollectionSong | None:
        with transaction.atomic():
            self._add_to_history()

            if self.context_collection:
                next_song = (
                    CollectionSong.objects.filter(
                        collection=self.context_collection,
                        position__gt=self.context_cursor,
                    )
                    .exclude(position__in=self.context_skip_indices)
                    .order_by("position")
                    .first()
                )
                if next_song:
                    self.current_collection_song = next_song
                    self.context_cursor = next_song.position
                    self.history_cursor = 0
                    self.save()
                    self._fill()
                    return self.current_collection_song

            self.current_collection_song = None
            self.history_cursor = 0
            self.save()
            return None

    def _add_to_history(self) -> None:
        if not self.current_collection_song:
            return
        try:
            history = self.streamingprofile.history
            CollectionSong.objects.create(
                collection=history,
                song=self.current_collection_song.song,
            )
        except ObjectDoesNotExist:
            pass

    def _skip_context_items_below(self, position: Decimal) -> None:
        context_items = QueueItem.objects.filter(
            queue=self,
            position__lt=position,
            origin=ItemOrigin.CONTEXT,
        )
        for ctx_item in context_items.select_related("collection_song"):
            ctx_pos = ctx_item.collection_song.position
            if ctx_pos is not None and ctx_pos > self.context_cursor:
                self.context_skip_indices.append(ctx_pos)

    def _calculate_append_position(self) -> Decimal:
        pos = self.next_item_position
        self.next_item_position += POSITION_GAP
        return pos

    def _fill(self, n=FILL_BATCH) -> None:
        if QueueItem.objects.filter(queue=self).count() >= REFILL_THRESHOLD:
            return

        with transaction.atomic():
            for source in list(
                QueueSource.objects.filter(queue=self).order_by("date_added")
            ):
                if n <= 0:
                    break
                n = self._fill_from_source(source, n)

            if n > 0:
                self._fill_from_context(n)

            self.save()

    def _fill_from_source(self, source: QueueSource, limit: int) -> int:
        if source.source_type == SourceType.SONG:
            return self._process_song_source(source, limit)
        return self._process_collection_source(source, limit)

    def _process_song_source(self, source: QueueSource, limit: int) -> int:
        if source.collection_song:
            QueueItem.objects.create(
                queue=self,
                collection_song=source.collection_song,
                position=self._calculate_append_position(),
                origin=ItemOrigin.SOURCE,
            )
            limit -= 1
        source.delete()
        return limit

    def _process_collection_source(self, source: QueueSource, limit: int) -> int:
        # we fetch limit + 1 songs, and if we get limit + 1 songs, this means that the source is not yet exhausted
        songs = list(
            CollectionSong.objects.filter(
                collection=source.collection,
                position__gt=source.collection_cursor,
            )
            .order_by("position")
            .select_related("song")[: limit + 1]
        )

        songs = songs[:limit]
        items = []
        for cs in songs:
            items.append(
                QueueItem(
                    queue=self,
                    collection_song=cs,
                    position=self._calculate_append_position(),
                    origin=ItemOrigin.SOURCE,
                )
            )
            source.collection_cursor = cs.position
        QueueItem.objects.bulk_create(items)

        if songs:
            source.save()
        if not len(songs) > limit:
            source.delete()

        return limit - len(items)

    def _fill_from_context(self, limit: int) -> None:
        if not self.context_collection:
            return

        existing_song_ids = set(
            QueueItem.objects.filter(queue=self, origin=ItemOrigin.CONTEXT).values_list(
                "collection_song_id", flat=True
            )
        )

        songs = list(
            CollectionSong.objects.filter(
                collection=self.context_collection,
                position__gt=self.context_cursor,
            )
            .exclude(position__in=self.context_skip_indices)
            .exclude(id__in=existing_song_ids)
            .order_by("position")
            .select_related("song")[:limit]
        )

        QueueItem.objects.bulk_create(
            [
                QueueItem(
                    queue=self,
                    collection_song=cs,
                    position=self._calculate_append_position(),
                    origin=ItemOrigin.CONTEXT,
                )
                for cs in songs
            ]
        )
