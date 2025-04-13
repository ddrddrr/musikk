import random

from django.db import models
from django.db import transaction

from base.models import BaseModel
from streaming.song_collections import SongCollection
from streaming.songs import BaseSong


class SongQueueNode(BaseModel):
    song = models.ForeignKey("streaming.BaseSong", on_delete=models.CASCADE)
    song_queue = models.ForeignKey("streaming.SongQueue", on_delete=models.CASCADE)

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

    def __iter__(self):
        current = self.head
        while current:
            yield current
            current = current.next

    # TODO: add error handling in order not to lose objects
    def delete(self, using=None, keep_parents=False):
        if self.prev:
            self.prev.next = self.next
            self.prev.save()
        else:
            self.head = self.next

        if self.next:
            self.next.prev = self.prev
            self.next.save()
        else:
            self.tail = self.prev

        if self is self.song_queue.add_after:
            self.song_queue.add_after = None
            self.song_queue.save()

        self.save()
        return super().delete(using, keep_parents)


class SongQueueManager(models.Manager):
    # TODO: add init_random method
    pass


# TODO: make transactions more fine-grained
class SongQueue(BaseModel):
    default_size = 30

    objects = SongQueueManager()
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

    # TODO: wrap all in transactions?
    def add_song(self, song: BaseSong, to_end=True) -> SongQueueNode | None:
        with transaction.atomic():
            node = SongQueueNode.objects.create(song=song, song_queue=self)

            if to_end:
                self.append_node(node)
            else:
                after = self.add_after if self.add_after else self.head
                self.add_node_after(node, after)

            self.song_count += 1
            self.save()
            return node

    def add_collection_songs(
        self, collection: SongCollection, to_end=True
    ) -> list[SongQueueNode]:
        with transaction.atomic():
            nodes = []
            for song in collection.songs.all():
                self.add_song(song, to_end=to_end)
                nodes.append(song)

            return nodes

    def add_node_after(
        self, node: SongQueueNode, target: SongQueueNode
    ) -> SongQueueNode:
        with transaction.atomic():
            if target is self.tail:
                return self.append_node(node)

            node.next = target.next
            node.prev = target

            if target.next:
                target.next.prev = node
                target.next.save()
                self.add_after = node
            else:
                self.tail = node
            target.next = node

            target.save()
            node.save()
            self.save()
            return node

    def append_node(self, node: SongQueueNode) -> SongQueueNode:
        with transaction.atomic():
            if self.song_count == 0:
                self.head = node
            else:
                tail = self.tail
                tail.next = node
                node.prev = tail
                tail.save()
            self.tail = node

            node.save()
            self.save()
            return node

    def delete_node(self, node: SongQueueNode) -> bool:
        # TODO: probably a try-catch block and return based on its res
        with transaction.atomic():
            node.delete()
            self.song_count -= 1
            self.save()
            return True

    # TODO: test and refactor
    def swap_nodes(self, node1: SongQueueNode, node2: SongQueueNode) -> bool:
        node1_prev, node1_next = node1.prev, node1.next
        node2_prev, node2_next = node2.prev, node2.next

        if node1.next == node2:  # node1 is immediately before node2
            node1.next, node2.prev = node2_next, node1_prev
            node2.next, node1.prev = node1, node2
        elif node2.next == node1:  # node2 is immediately before node1
            node2.next, node1.prev = node1_next, node2_prev
            node1.next, node2.prev = node2, node1
        else:  # non-adjacent
            node1.prev, node1.next = node2_prev, node2_next
            node2.prev, node2.next = node1_prev, node1_next

        if node1.prev:
            node1.prev.next = node1
        else:
            self.head = node1

        if node1.next:
            node1.next.prev = node1
        else:
            self.tail = node1

        if node2.prev:
            node2.prev.next = node2
        else:
            self.head = node2

        if node2.next:
            node2.next.prev = node2
        else:
            self.tail = node2

        self.save()
        node1.save()
        node2.save()

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
            return [self.add_song(song) for song in songs]

    def apply(self, func: callable) -> None:
        current = self.head
        while current:
            func(current)
            current = current.next
