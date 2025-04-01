from django.conf import settings
from django.db import models

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

        self.save()
        return super().delete(using, keep_parents)


class SongQueueManager(models.Manager):
    # TODO: add init_random method
    pass


class SongQueue(BaseModel):
    objects = SongQueueManager()
    head = models.OneToOneField(
        SongQueueNode,
        default=None,
        null=True,
        on_delete=models.SET_NULL,
        related_name="+",
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
    def add_song(
        self,
        song: BaseSong,
        before: SongQueueNode = None,
        after: SongQueueNode = None,
    ) -> SongQueueNode | None:
        node = SongQueueNode.objects.create(song=song, song_queue=self)

        if before:
            return self.add_node_before(node, before)
        elif after:
            return self.add_node_after(node, after)
        else:
            self.append_node(node)

        self.song_count += 1
        self.save()
        return node

    def append_collection_songs(self, collection: SongCollection):
        # TODO: implement, maybe also add after head?
        raise NotImplementedError()

    # TODO: implement
    # from likedsongs --> filter on likedsongs id
    # total random --> all available songs in the sys
    # radom on hastags --> all available with hashtag
    def append_random_songs(
        self, size: int = settings.DEFAULT_SONG_QUEUE_SIZE, where: str = ""
    ) -> list[SongQueueNode]:
        query = (
            f"SELECT * FROM {BaseSong._meta.db_table} TABLESAMPLE SYSTEM_ROWS({size})"
        )
        query = query + where
        songs = BaseSong.objects.raw(query)
        return [self.add_song(song) for song in songs]

    def add_node_before(
        self, node: SongQueueNode, target: SongQueueNode
    ) -> SongQueueNode:
        node.next = target
        node.prev = target.prev

        if target.prev:
            target.prev.next = node
            target.prev.next.save()
        else:
            self.head = node
        target.prev = node

        node.save()
        target.save()
        self.save()
        return node

    def add_node_after(
        self, node: SongQueueNode, target: SongQueueNode
    ) -> SongQueueNode:
        node.next = target.next
        node.prev = target

        if target.next:
            target.next.prev = node
            target.next.prev.save()
        else:
            self.tail = node
        target.next = node

        node.save()
        target.save()
        self.save()
        return node

    def append_node(self, node: SongQueueNode) -> SongQueueNode:
        if self.song_count == 0:
            self.head = node
        else:
            tail = self.tail
            tail.next = node
            node.prev = tail
            tail.save()
        self.tail = node
        node.is_tail = True

        node.save()
        self.save()
        return node

    def delete_node(self, node: SongQueueNode) -> bool:
        # TODO: probably a try-catch block and return based on its res
        node.delete()
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
