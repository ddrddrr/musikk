from django.contrib.contenttypes.models import ContentType
from rest_framework import serializers

from base.serializers import BaseModelSerializer
from social.models import Publication


class PublicationCreateSerializer(BaseModelSerializer):
    obj_type = serializers.CharField(write_only=True, allow_null=True, required=False)
    obj_uuid = serializers.UUIDField(write_only=True, allow_null=True, required=False)
    parent = serializers.UUIDField(write_only=True, required=False, allow_null=True)

    class Meta(BaseModelSerializer.Meta):
        model = Publication
        fields = BaseModelSerializer.Meta.fields + [
            "content",
            "user",
            "parent",
            "obj_type",
            "obj_uuid",
            "type",
        ]
        extra_kwargs = {
            "user": {"write_only": True},
        }

    def create(self, validated_data):
        obj_type = validated_data.pop("obj_type", None)
        obj_uuid = validated_data.pop("obj_uuid", None)

        if bool(obj_type) != bool(obj_uuid):
            raise serializers.ValidationError(
                "Both 'obj_type' and 'obj_uuid' must be excluded or provided together."
            )

        related_instance = (
            Publication.lookup_related_instance(obj_type, obj_uuid)
            if obj_type and obj_uuid
            else None
        )

        parent_uuid = validated_data.pop("parent", None)
        parent = Publication.objects.get(uuid=parent_uuid) if parent_uuid else None
        create_kwargs = {
            "parent": parent,
            **validated_data,
        }

        pub_type = validated_data["type"]
        if pub_type == "comment" and related_instance:
            return related_instance.comments.create(**create_kwargs)

        elif pub_type == "post" and related_instance:
            create_kwargs["content_type"] = ContentType.objects.get_for_model(
                related_instance
            )
            create_kwargs["object_id"] = related_instance.id

        return Publication.objects.create(**create_kwargs)


class PublicationRetrieveSerializer(BaseModelSerializer):
    display_name = serializers.SerializerMethodField(read_only=True)
    obj_type = serializers.SerializerMethodField(allow_null=True, read_only=True)
    obj_uuid = serializers.SerializerMethodField(allow_null=True, read_only=True)
    parent = serializers.UUIDField(
        source="parent.uuid", allow_null=True, read_only=True
    )
    user_uuid = serializers.UUIDField(source="user.uuid", read_only=True)
    root_user_uuid = serializers.SerializerMethodField(allow_null=True, read_only=True)

    class Meta(BaseModelSerializer.Meta):
        model = Publication
        fields = BaseModelSerializer.Meta.fields + [
            "content",
            "display_name",
            "user_uuid",
            "parent",
            "is_deleted",
            "obj_type",
            "obj_uuid",
            "type",
            "root_user_uuid",
        ]

    def get_display_name(self, obj):
        return obj.user.display_name if obj.user else None

    def get_obj_type(self, obj):
        return (
            Publication.get_type_from_model(obj.content_object)
            if obj.content_object
            else None
        )

    def get_obj_uuid(self, obj):
        return str(obj.content_object.uuid) if obj.content_object else None

    def get_root_user_uuid(self, obj):
        if obj.type == "post":
            return obj.get_root().user.uuid
        return None
