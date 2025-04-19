from rest_framework import serializers

from base.serializers import BaseModelSerializer
from social.models import Comment
from users.user_base import BaseUser


class CommentSerializer(BaseModelSerializer):
    user_uuid = serializers.UUIDField(write_only=True)
    username = serializers.SerializerMethodField(read_only=True)

    class Meta(BaseModelSerializer.Meta):
        model = Comment
        fields = BaseModelSerializer.Meta.fields + [
            "content",
            "user_uuid",
            "username",
            "parent",
            "is_deleted",
        ]
        extra_kwargs = {
            "is_deleted": {"read_only": True},
        }

    def get_username(self, obj):
        return obj.user.display_name if obj.user else None

    def create(self, validated_data):
        user = BaseUser.objects.get(uuid=validated_data.pop("user_uuid"))
        parent = Comment.objects.get(uuid=validated_data.pop("parent"))
        return Comment.objects.create(user=user, parent=parent, **validated_data)
