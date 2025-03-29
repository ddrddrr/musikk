from django.db import models

from base.models import BaseModel


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

    # TODO: implement add_random method
    # TODO: wrap in transaction
    def add_node(
        self,
        node: SongQueueNode,
        before: SongQueueNode = None,
        after: SongQueueNode = None,
    ) -> SongQueueNode | None:
        if before:
            return self.add_before(node, before)
        elif after:
            return self.add_after(node, after)
        else:
            self.append_node(node)

        return node

    def add_before(self, node: SongQueueNode, target: SongQueueNode) -> SongQueueNode:
        node.next = target
        node.prev = target.prev

        if target.prev:
            target.prev.next = node
            target.prev.next.save()
        else:
            node.song_queue.head = node
        target.prev = node

        node.save()
        target.save()
        node.song_queue.save()
        return node

    def add_after(self, node: SongQueueNode, target: SongQueueNode) -> SongQueueNode:
        node.next = target.next
        node.prev = target

        if target.next:
            target.next.prev = node
            target.next.prev.save()
        else:
            node.song_queue.tail = node
        target.next = node

        node.save()
        target.save()
        node.song_queue.save()
        return node

    def append_node(self, node: SongQueueNode) -> SongQueueNode:
        if self.objects.count() == 0:
            node.song_queue.head = node
        else:
            tail = node.song_queue.tail
            tail.next = node
            tail.save()
            node.song_queue.tail = node
        node.is_tail = True

        node.save()
        node.song_queue.save()
        return node

    def delete_node(self, node: SongQueueNode) -> bool:
        if node.prev:
            node.prev.next = node.next
            node.prev.save()
        else:
            node.song_queue.head = node.next

        if node.next:
            node.next.prev = node.prev
            node.next.save()
        else:
            node.song_queue.tail = node.prev

        node.song_queue.save()
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
            node1.song_queue.head = node1

        if node1.next:
            node1.next.prev = node1
        else:
            node1.song_queue.tail = node1

        if node2.prev:
            node2.prev.next = node2
        else:
            node2.song_queue.head = node2

        if node2.next:
            node2.next.prev = node2
        else:
            node2.song_queue.tail = node2

        node1.song_queue.save()
        node2.song_queue.save()
        node1.save()
        node2.save()

        return True
