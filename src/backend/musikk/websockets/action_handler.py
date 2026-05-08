from abc import ABC, abstractmethod
from collections.abc import Callable
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from websockets.base_consumer import BaseConsumer


class WSActionHandler(ABC):
    def __init__(self, consumer: BaseConsumer) -> None:
        self.consumer = consumer

    @abstractmethod
    def get_actions(self) -> dict[str, Callable]:
        pass

    # not the best to couple the ws consumer's on_disconnect to action handlers
    # TODO: should be probably moved to a separate disconnect handler
    def on_disconnect(self) -> None:
        pass
