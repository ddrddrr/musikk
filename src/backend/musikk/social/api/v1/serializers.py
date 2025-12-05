from rest_framework import serializers

from base.serializers import BaseModelSerializer
from social.api.v1.type_to_model_maps import (
    CREATED_FOR_TYPE_TO_MODEL_MAP,
    ATTACHMENT_TYPE_TO_MODEL_MAP,
)
from social.models import Publication
from users.api.v1.serializers import BaseUserSerializer


class PublicationCreateSerializer(BaseModelSerializer):
    author = serializers.HiddenField(default=serializers.CurrentUserDefault())
    obj_type = serializers.CharField(write_only=True)
    obj_uuid = serializers.UUIDField(write_only=True)
    attachment_type = serializers.CharField(
        write_only=True, allow_null=True, required=False
    )
    attachment_uuid = serializers.UUIDField(
        write_only=True, allow_null=True, required=False
    )
    parent_uuid = serializers.UUIDField(
        write_only=True, required=False, allow_null=True
    )

    class Meta(BaseModelSerializer.Meta):
        model = Publication
        fields = BaseModelSerializer.Meta.fields + [
            "content",
            "obj_type",
            "obj_uuid",
            "attachment_type",
            "attachment_uuid",
            "parent_uuid",
        ]

    def create(self, validated_data):
        obj_type = validated_data.pop("obj_type", None)
        obj_uuid = validated_data.pop("obj_uuid", None)
        if not obj_type or not obj_uuid:
            raise serializers.ValidationError(
                ["Both 'obj_type' and 'obj_uuid' must be provided."]
            )

        related_model = CREATED_FOR_TYPE_TO_MODEL_MAP.get(obj_type)
        if not related_model:
            raise serializers.ValidationError(
                f"Unknown object type for `Publication` creation: {obj_type}."
            )

        # main "created_for" object lookup
        try:
            created_for_obj = related_model.objects.get(uuid=obj_uuid)
        except related_model.DoesNotExist:
            raise serializers.ValidationError(
                [
                    f"Object for `Publication` creation does not exist: {obj_type} {obj_uuid}."
                ]
            )

        attachment_type = validated_data.pop("attachment_type", None)
        attachment_uuid = validated_data.pop("attachment_uuid", None)
        if (not attachment_type and attachment_uuid) or (
            attachment_type and not attachment_uuid
        ):
            raise serializers.ValidationError(
                [
                    "Either provide both `attachment_type` and `attachment_uuid` or do not provide neither."
                ]
            )

        attachment_object = None
        if attachment_type:
            attachment_model = ATTACHMENT_TYPE_TO_MODEL_MAP.get(attachment_type)
            if not attachment_model:
                raise serializers.ValidationError(
                    f"Unknown attachment type for `Publication` creation: {attachment_type}."
                )
            try:
                attachment_object = attachment_model.objects.get(uuid=attachment_uuid)
            except attachment_model.DoesNotExist:
                raise serializers.ValidationError(
                    [
                        f"Attachment object does not exist: "
                        f"{attachment_type} {attachment_uuid}."
                    ]
                )

        parent_uuid = validated_data.pop("parent_uuid", None)
        parent = None
        if parent_uuid:
            try:
                parent = Publication.objects.get(uuid=parent_uuid)
            except Publication.DoesNotExist:
                raise serializers.ValidationError(
                    [f"Parent publication does not exist: {parent_uuid}."]
                )

        return Publication.objects.create(
            parent=parent,
            created_for_object=created_for_obj,
            attachment_object=attachment_object,
            **validated_data,
        )


class PublicationRetrieveSerializer(BaseModelSerializer):
    author = BaseUserSerializer(read_only=True)
    obj_type = serializers.SerializerMethodField(allow_null=True, read_only=True)
    obj_uuid = serializers.SerializerMethodField(allow_null=True, read_only=True)
    attachment_type = serializers.SerializerMethodField(allow_null=True, read_only=True)
    attachment_uuid = serializers.SerializerMethodField(allow_null=True, read_only=True)
    parent_uuid = serializers.SerializerMethodField(allow_null=True, read_only=True)

    class Meta(BaseModelSerializer.Meta):
        model = Publication
        fields = BaseModelSerializer.Meta.fields + [
            "author",
            "content",
            "parent_uuid",
            "is_deleted",
            "obj_type",
            "obj_uuid",
            "attachment_type",
            "attachment_uuid",
        ]

    def get_obj_type(self, obj):
        obj_type = obj.created_for_type.model_class()
        for k, v in CREATED_FOR_TYPE_TO_MODEL_MAP.items():
            if v == obj_type:
                return k

        assert False, f"The related class for Publication does not exist: {obj_type}"

    def get_obj_uuid(self, obj):
        return str(obj.created_for_object.uuid)

    def get_attachment_type(self, obj):
        if not obj.attachment_type:
            return None
        attachment_type = obj.attachment_type.model_class()
        for k, v in ATTACHMENT_TYPE_TO_MODEL_MAP.items():
            if v == attachment_type:
                return k
        assert False, f"The related Attachment class does not exist {attachment_type}"

    def get_attachment_uuid(self, obj):
        return str(obj.attachment_object.uuid) if obj.attachment_object else None

    def get_parent_uuid(self, obj):
        return str(obj.parent.uuid) if obj.parent else None
