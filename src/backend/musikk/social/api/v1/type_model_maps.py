from typing import TypedDict

from django.db import models

from streaming.api.v1.serializers import (
    CollectionSerializerBasic,
    CollectionSongSerializer,
)
from users.api.v1.serializers import BaseUserSerializer
from streaming.models import Collection, CollectionSong
from users.models import BaseUser


class TypeToModelError(Exception):
    pass


class UnknownTypeError(TypeToModelError):
    def __init__(self, type_key: str):
        self.type_key = type_key
        super().__init__(f"Unknown type: {type_key}")


class ObjectDoesNotExistError(TypeToModelError):
    def __init__(self, type_key: str, uuid_val: str):
        self.type_key = type_key
        self.uuid_val = uuid_val
        super().__init__(f"Object does not exist: {type_key} {uuid_val}")


class InvalidRefError(TypeToModelError):
    def __init__(self):
        super().__init__("Expected {type, uuid}.")


class TypeToModelRef(TypedDict):
    type: str
    uuid: str


class TypeToModelResolver:
    def __init__(
        self,
        type_model_map: dict[str, type[models.Model]],
        model_type_map: dict[type[models.Model], str],
        type_serializer_map: dict[str, type] | None = None,
    ):
        self.type_model_map = type_model_map
        self.model_type_map = model_type_map
        self.type_serializer_map = type_serializer_map or {}

    @classmethod
    def from_map(
        cls,
        type_model_map: dict[str, type[models.Model]],
        type_serializer_map: dict[str, type] | None = None,
    ) -> "TypeToModelResolver":
        return cls(
            type_model_map=type_model_map,
            model_type_map={
                model: type_key for type_key, model in type_model_map.items()
            },
            type_serializer_map=type_serializer_map,
        )

    def resolve_model_instance(self, ref: TypeToModelRef) -> models.Model:
        type_key = ref.get("type")
        uuid_val = ref.get("uuid")
        if not type_key or not uuid_val:
            raise InvalidRefError()

        Model = self.type_model_map.get(type_key)
        if not Model:
            raise UnknownTypeError(type_key)

        return Model.objects.get(uuid=uuid_val)

    def get_model_instance_representation(self, obj: models.Model) -> TypeToModelRef:
        type_key = self.model_type_map.get(obj.__class__)
        if not type_key:
            raise UnknownTypeError(f"Unregistered model: {obj.__class__}")
        return {"type": type_key, "uuid": str(obj.uuid)}

    def serialize_model_instance(
        self, obj: models.Model, context: dict | None = None
    ) -> dict:
        type_key = self.model_type_map.get(obj.__class__)
        if not type_key:
            raise UnknownTypeError(f"Unregistered model: {obj.__class__}")

        serializer_class = self.type_serializer_map.get(type_key)
        if not serializer_class:
            raise UnknownTypeError(f"No serializer registered for type: {type_key}")

        serializer = serializer_class(obj, context=context or {})
        return {
            "type": type_key,
            "obj": serializer.data,
        }


CREATED_FOR_RESOLVER = TypeToModelResolver.from_map(
    {
        "collection": Collection,
        "feed": BaseUser,
    },
)


def _get_attachment_resolver() -> TypeToModelResolver:
    return TypeToModelResolver.from_map(
        type_model_map={
            "collection": Collection,
            "song": CollectionSong,
            "user": BaseUser,
        },
        type_serializer_map={
            "collection": CollectionSerializerBasic,
            "song": CollectionSongSerializer,
            "user": BaseUserSerializer,
        },
    )


ATTACHMENT_RESOLVER = TypeToModelResolver.from_map(
    type_model_map={
        "collection": Collection,
        "song": CollectionSong,
        "user": BaseUser,
    },
    type_serializer_map={
        "collection": CollectionSerializerBasic,
        "song": CollectionSongSerializer,
        "user": BaseUserSerializer,
    },
)
