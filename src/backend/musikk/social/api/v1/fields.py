from rest_framework import serializers

from social.api.v1.type_model_maps import TypeToModelResolver


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
