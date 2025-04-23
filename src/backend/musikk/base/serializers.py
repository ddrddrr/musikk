from rest_framework import serializers

from base.models import BaseModel


class UUIDRelatedModelSerializerMixin:
    """
    A base serializer that rewrites `id` fields to `uuid` for related models.
    """

    def to_representation(self, instance):
        representation = super().to_representation(instance)

        for field_name, field in self.fields.items():
            if isinstance(field, serializers.PrimaryKeyRelatedField):
                related_instance = getattr(instance, field_name)
                if related_instance and hasattr(related_instance, "uuid"):
                    representation[field_name] = str(related_instance.uuid)

            elif isinstance(field, serializers.ManyRelatedField) and isinstance(
                field.child_relation, serializers.PrimaryKeyRelatedField
            ):
                related_instances = getattr(instance, field_name).all()
                representation[field_name] = [
                    str(obj.uuid) for obj in related_instances if hasattr(obj, "uuid")
                ]

        return representation


class BaseModelSerializer(UUIDRelatedModelSerializerMixin, serializers.ModelSerializer):
    class Meta:
        model = BaseModel
        fields = ["uuid", "date_added", "date_modified"]
        extra_kwargs = {
            "uuid": {"read_only": True},
            "date_added": {"read_only": True},
            "date_modified": {"read_only": True},
        }
