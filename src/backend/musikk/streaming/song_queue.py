import random

from django.db import models
from django.db import transaction

from base.models import BaseModel
from streaming.song_collections import SongCollection
from streaming.songs import BaseSong, SongCollectionSong


class SongQueueNode(BaseModel):
    song = models.ForeignKey("streaming.BaseSong", on_delete=models.CASCADE)
    song_queue = models.ForeignKey(
        "streaming.SongQueue", on_delete=models.CASCADE, related_name="nodes"
    )

    # TODO: add proper processing for on_delete
    next = models.OneToOneField(
        "self",
        default=None,
        null=True,
        on_delete=models.SET_NULL,
        related_name="+",
    )
    prev = models.OneToOneField(
        "self",
        default=None,
        null=True,
        on_delete=models.SET_NULL,
        related_name="+",
    )

    # TODO: add error handling in order not to lose objects
    def delete(self, using=None, keep_parents=False):
        with transaction.atomic():
            if self.prev:
                self.prev.next = self.next
                self.prev.save()
            else:
                self.song_queue.head = self.next

            if self.next:
                self.next.prev = self.prev
                self.next.save()
            else:
                self.song_queue.tail = self.prev

            if self is self.song_queue.add_after:
                self.song_queue.add_after = self.prev

            self.song_queue.save()
            return super().delete(using, keep_parents)


class SongQueueManager(models.Manager):
    # TODO: add init_random method
    pass


# TODO: make transactions more fine-grained
class SongQueue(BaseModel):
    class AddAction:
        """
        `CHANGE_HEAD` removes the current head and sets it to the provided song
        `ADD` uses `song_queue.add_after` to figure out, where to add the song
        `APPEND` appends the song to the end
        """

        CHANGE_HEAD = "change_head"
        ADD = "add"
        APPEND = "append"

    default_size = 30

    head = models.OneToOneField(
        SongQueueNode,
        default=None,
        null=True,
        on_delete=models.SET_NULL,
        related_name="+",
    )
    add_after = models.OneToOneField(
        SongQueueNode,
        default=None,
        null=True,
        on_delete=models.SET_NULL,
        related_name="+",
        help_text="The node after which the songs will be appended when `Add To Queue` is used. "
        "If the song/collection is appended, equal to this song/last song in collection."
        "Otherwise is equal to `head`.",
    )
    tail = models.OneToOneField(
        SongQueueNode,
        default=None,
        null=True,
        on_delete=models.SET_NULL,
        related_name="+",
    )
    # INFO: used instead of calling `COUNT()`, as this is accessed frequently
    song_count = models.IntegerField(default=0)

    objects = SongQueueManager()

    # TODO: wrap all in transactions?
    def add_song(
        self, song: BaseSong, action: str = AddAction.ADD
    ) -> SongQueueNode | None:
        with transaction.atomic():
            node = SongQueueNode.objects.create(song=song, song_queue=self)

            match action:
                case self.AddAction.CHANGE_HEAD:
                    self._set_head(node)
                case self.AddAction.APPEND:
                    self._append_node(node)
                case self.AddAction.ADD:
                    after = self.add_after if self.add_after else self.head
                    if after is None:  # no queued songs
                        self._set_head(node)
                        self.add_after = node
                    else:
                        self._add_node_after(node, after)
                case _:
                    raise f"Got an unknown add action type {action} for `add_song` action"

            self.save()
            return node

    def add_collection(
        self, collection: SongCollection, action=AddAction.ADD
    ) -> list[SongQueueNode]:
        with transaction.atomic():
            if not (songs := collection.ordered_songs()):
                return []

            nodes = []
            old_add_after = self.add_after
            match action:
                case self.AddAction.CHANGE_HEAD:
                    new_head = self.add_song(
                        songs[0], action=self.AddAction.CHANGE_HEAD
                    )
                    nodes.append(new_head)

                    if len(songs) > 1:
                        self.add_after = new_head
                        for song in songs[1:]:
                            node = self.add_song(song, action=self.AddAction.ADD)
                            nodes.append(node)
                        self.add_after = old_add_after
                        self.save()

                case self.AddAction.APPEND | self.AddAction.ADD:
                    for song in songs:
                        self.add_song(song, action=action)
                        nodes.append(song)
                case _:
                    raise ValueError(
                        f"Got an unknown add action type {action} for `add_collection_songs` action"
                    )
            self.apply(lambda x: print(x.song))
            return nodes

    def shift_head_forward(self, to: SongQueueNode) -> SongQueueNode | None:
        if self.is_empty():
            return None
        with transaction.atomic():
            shifted_nodes = []
            curr = self.head
            while curr is not to and curr is not None:
                shifted_nodes.append(curr)
                curr = curr.next
            if curr:
                if self.add_after in shifted_nodes:
                    self.add_after = None
                self.song_count -= len(shifted_nodes)

            SongCollectionSong.objects.create(
                song_collection=self.user.history,
                song=self.head.song,
            )

            self.head = curr
            self.save()

    def shift_head_backwards(self) -> SongQueueNode | None:
        if not self.head or not self.head.prev:
            return None
        with transaction.atomic():
            self.head = self.head.prev
            SongCollectionSong.objects.create(
                song_collection=self.user.history,
                song=self.head.song,
            )
            self.save()

    def clear(self):
        # doesn't call `delete` of the individual nodes, safe
        with transaction.atomic():
            self.nodes.all().delete()
            self.head, self.tail, self.add_after = None, None, None
            self.song_count = 0
            self.save()

    def _add_node_after(
        self, node: SongQueueNode, target: SongQueueNode
    ) -> SongQueueNode:
        """Used for enqueueing"""
        with transaction.atomic():
            if target is self.tail:
                self._append_node(node)
            else:
                node.next = target.next
                node.prev = target

                if target.next:
                    target.next.prev = node
                    target.next.save()
                else:
                    self.tail = node

                target.next = node
                self.song_count += 1

            self.add_after = node

            target.save()
            node.save()
            self.save()
            return node

    def _set_head(self, node: SongQueueNode) -> SongQueueNode:
        """Used when play is clicked"""
        with transaction.atomic():
            if self.is_empty():
                self.head = node
                self.tail = node
                self.song_count += 1
            else:
                second = self.head.next
                self.head.next = node
                self.head.save()
                if second:
                    node.next = second
                    second.prev = node
                    second.save()
                else:
                    self.tail = node  # only one node was in the queue

                self.head = node

            node.save()
            self.save()

            return node

    def _append_node(self, node: SongQueueNode) -> SongQueueNode:
        """
        Warning: should be used only for appending to the end!
        Does not update the `add_after` attr.
        """
        with transaction.atomic():
            if self.is_empty():
                self.head = node
            else:
                tail = self.tail
                tail.next = node
                node.prev = tail
                tail.save()
            self.tail = node
            self.song_count += 1

            node.save()
            self.save()
            return node

    def delete_node(self, node: SongQueueNode) -> bool:
        # TODO: probably a try-catch block and return based on its res
        with transaction.atomic():
            node.delete()
            self.song_count -= 1
            print(self.head)
            self.save()
            return True

    # TODO: implement, complete the table approach
    # from likedsongs --> filter on likedsongs id
    # total random --> all available songs in the sys
    # radom on hastags --> all available with hashtag
    def append_random_songs(
        self,
        amount: int = default_size,
    ) -> list[SongQueueNode]:
        # query = (
        #     f"SELECT * FROM {BaseSong._meta.db_table} TABLESAMPLE SYSTEM_ROWS({size})"
        # )
        # query = query + where
        if amount < self.song_count:
            return []
        with transaction.atomic():
            qs = BaseSong.objects.all()
            songs = random.choices(qs, k=min(amount, len(qs)))
            return [self.add_song(song, action=self.AddAction.APPEND) for song in songs]

    def is_empty(self):
        return self.head is None

    def apply(self, func: callable) -> None:
        current = self.head
        while current:
            func(current)
            current = current.next
