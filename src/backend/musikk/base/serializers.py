from rest_framework import serializers

from base.models import BaseModel


class BaseModelSerializer(serializers.ModelSerializer):
    repr = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = BaseModel
        fields = ["uuid", "date_added", "date_modified", "repr"]
        extra_kwargs = {
            "uuid": {"read_only": True},
            "date_added": {"read_only": True},
            "date_modified": {"read_only": True},
            "repr": {"read_only": True},
        }

    def get_repr(self, obj) -> str:
        return str(obj)


class UUIDListField(serializers.ListField):
    child = serializers.UUIDField()

    def to_internal_value(self, data):
        if data == "":
            data = []
        elif isinstance(data, str):
            data = [data]
        return super().to_internal_value(data)
