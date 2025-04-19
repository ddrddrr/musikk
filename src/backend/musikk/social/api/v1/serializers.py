from rest_framework import serializers

from base.serializers import BaseModelSerializer
from social.models import Comment
from users.api.v1.serializers import BaseUserSerializer


class CommentSerializer(BaseModelSerializer):
    username = serializers.SerializerMethodField(read_only=True)
    obj_type = serializers.CharField(write_only=True)
    obj_uuid = serializers.UUIDField(write_only=True)

    class Meta(BaseModelSerializer.Meta):
        model = Comment
        fields = BaseModelSerializer.Meta.fields + [
            "content",
            "user",
            "username",
            "parent",
            "is_deleted",
            "obj_type",
            "obj_uuid",
        ]
        extra_kwargs = {
            "user": {"write_only": True},
            "is_deleted": {"read_only": True},
        }

    def get_username(self, obj):
        return obj.user.display_name if obj.user else None

    def create(self, validated_data):
        obj_type = validated_data.pop("obj_type")
        obj_uuid = validated_data.pop("obj_uuid")
        related_instance = Comment.lookup_related_instance(obj_type, obj_uuid)

        parent_uuid = validated_data.pop("parent", None)
        parent = Comment.objects.get(uuid=parent_uuid) if parent_uuid else None
        return related_instance.comments.create(parent=parent, **validated_data)
