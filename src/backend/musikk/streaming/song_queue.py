from django.db import models

from musikk.models import BaseModel


class SongQueueNode(BaseModel):
    song = models.ForeignKey("streaming.models.BaseSong", on_delete=models.CASCADE)
    song_queue = models.ForeignKey(
        "streaming.models.SongQueue", on_delete=models.CASCADE
    )

    # TODO: add proper processing for on_delete
    next_ = models.OneToOneField(
        "self",
        default=None,
        on_delete=models.SET_NULL,
        null=True,
        related_name="+",
    )
    prev = models.OneToOneField(
        "self",
        default=None,
        on_delete=models.SET_NULL,
        null=True,
        related_name="+",
    )


class SongQueueManager(models.Manager):
    # TODO: add init_random method
    pass


class SongQueue(BaseModel):
    objects = SongQueueManager()
    head = models.OneToOneField(
        SongQueueNode, default=None, none=True, on_delete=models.SET_NULL
    )
    tail = models.OneToOneField(
        SongQueueNode, default=None, none=True, on_delete=models.SET_NULL
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
            self.append(node)

        return node

    def add_before(self, node: SongQueueNode, target: SongQueueNode) -> SongQueueNode:
        node.next_ = target
        node.prev = target.prev

        if target.prev:
            target.prev.next_ = node
            target.prev.next_.save()
        else:
            node.song_queue.head = node
        target.prev = node

        node.save()
        target.save()
        node.song_queue.save()
        return node

    def add_after(self, node: SongQueueNode, target: SongQueueNode) -> SongQueueNode:
        node.next_ = target.next_
        node.prev = target

        if target.next_:
            target.next_.prev = node
            target.next_.prev.save()
        else:
            node.song_queue.tail = node
        target.next_ = node

        node.save()
        target.save()
        node.song_queue.save()
        return node

    def append_node(self, node: SongQueueNode) -> SongQueueNode:
        if self.objects.count() == 0:
            node.song_queue.head = node
        else:
            tail = node.song_queue.tail
            tail.next_ = node
            tail.save()
            node.song_queue.tail = node
        node.is_tail = True

        node.save()
        node.song_queue.save()
        return node

    def delete_node(self, node: SongQueueNode) -> bool:
        if node.prev:
            node.prev.next_ = node.next_
            node.prev.save()
        else:
            node.song_queue.head = node.next_

        if node.next_:
            node.next_.prev = node.prev
            node.next_.save()
        else:
            node.song_queue.tail = node.prev

        node.song_queue.save()
        node.delete()
        return True

    # TODO: test and refactor
    def swap_nodes(self, node1: SongQueueNode, node2: SongQueueNode) -> bool:
        node1_prev, node1_next = node1.prev, node1.next_
        node2_prev, node2_next = node2.prev, node2.next_

        if node1.next_ == node2:  # node1 is immediately before node2
            node1.next_, node2.prev = node2_next, node1_prev
            node2.next_, node1.prev = node1, node2
        elif node2.next_ == node1:  # node2 is immediately before node1
            node2.next_, node1.prev = node1_next, node2_prev
            node1.next_, node2.prev = node2, node1
        else:  # non-adjacent
            node1.prev, node1.next_ = node2_prev, node2_next
            node2.prev, node2.next_ = node1_prev, node1_next

        if node1.prev:
            node1.prev.next_ = node1
        else:
            node1.song_queue.head = node1

        if node1.next_:
            node1.next_.prev = node1
        else:
            node1.song_queue.tail = node1

        if node2.prev:
            node2.prev.next_ = node2
        else:
            node2.song_queue.head = node2

        if node2.next_:
            node2.next_.prev = node2
        else:
            node2.song_queue.tail = node2

        node1.song_queue.save()
        node2.song_queue.save()
        node1.save()
        node2.save()

        return True
