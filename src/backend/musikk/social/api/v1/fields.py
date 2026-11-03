from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from social.api.v1.type_model_maps import TypeToModelResolver


class TypeModelRefSerializer(serializers.Serializer):
    """
    The `{type, uuid}` reference that `TypeToModelResolver` reads and writes.
    Only the schema uses it, because the resolver builds and reads the dict
    itself.
    """

    type = serializers.CharField()
    uuid = serializers.UUIDField()


@extend_schema_field(TypeModelRefSerializer)
class TypeModelRefField(serializers.Field):
    def __init__(self, resolver: TypeToModelResolver, **kwargs):
        super().__init__(**kwargs)
        self.resolver = resolver

    def to_internal_value(self, data):
        if data is None:
            return None
        if not isinstance(data, dict):
            # TODO:
            raise serializers.ValidationError()
        try:
            return self.resolver.resolve_model_instance(data)
        except Exception:
            # TODO:
            raise serializers.ValidationError()

    def to_representation(self, value):
        if value is None:
            return None
        return self.resolver.get_model_instance_representation(value)
