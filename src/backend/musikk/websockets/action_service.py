from abc import ABC, abstractmethod
from collections.abc import Callable
from typing import TYPE_CHECKING, Literal, TypedDict

from rest_framework import serializers

if TYPE_CHECKING:
    from websockets.base_consumer import BaseConsumer


class WSAction(TypedDict):
    """An action that a client can send, with the serializer for its payload.

    The consumer runs the serializer before it calls the handler, so the handler
    gets only valid data. `on_invalid` says what happens to an invalid payload.
    With `"error"` the tab gets an error event. With `"drop"` the message is
    ignored.
    """

    handler: Callable[[dict], None]
    serializer: type[serializers.Serializer]
    on_invalid: Literal["error", "drop"]


class WSActionService(ABC):
    def __init__(self, consumer: BaseConsumer) -> None:
        self.consumer = consumer

    @abstractmethod
    def get_actions(self) -> dict[str, WSAction]:
        pass

    # not the best to couple the ws consumer's on_disconnect to action services
    # TODO: should be probably moved to a separate disconnect handler
    def on_disconnect(self) -> None:
        pass
