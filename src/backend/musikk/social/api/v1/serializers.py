from rest_framework import serializers

from base.serializers import BaseModelSerializer
from social.models import Comment


class CommentWriteSerializer(BaseModelSerializer):
    obj_type = serializers.CharField()
    obj_uuid = serializers.CharField()
    parent = serializers.UUIDField(required=False, allow_null=True)

    class Meta(BaseModelSerializer.Meta):
        model = Comment
        fields = BaseModelSerializer.Meta.fields + [
            "content",
            "user",
            "parent",
            "obj_type",
            "obj_uuid",
        ]
        extra_kwargs = {
            "user": {"write_only": True},
        }

    def create(self, validated_data):
        obj_type = validated_data.pop("obj_type")
        obj_uuid = validated_data.pop("obj_uuid")
        related_instance = Comment.lookup_related_instance(obj_type, obj_uuid)

        parent_uuid = validated_data.pop("parent", None)
        parent = Comment.objects.get(uuid=parent_uuid) if parent_uuid else None
        return related_instance.comments.create(parent=parent, **validated_data)


class CommentReadSerializer(BaseModelSerializer):
    username = serializers.SerializerMethodField()
    obj_type = serializers.SerializerMethodField()
    obj_uuid = serializers.SerializerMethodField()
    parent = serializers.UUIDField(source="parent.uuid", read_only=True)

    class Meta(BaseModelSerializer.Meta):
        model = Comment
        fields = BaseModelSerializer.Meta.fields + [
            "content",
            "username",
            "parent",
            "is_deleted",
            "obj_type",
            "obj_uuid",
        ]

    def get_username(self, obj):
        return obj.user.display_name if obj.user else None

    def get_obj_type(self, obj):
        return (
            Comment.get_type_from_model(obj.content_object)
            if obj.content_object
            else None
        )

    def get_obj_uuid(self, obj):
        return str(obj.content_object.uuid) if obj.content_object else None
