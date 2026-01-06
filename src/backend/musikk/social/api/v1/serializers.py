from rest_framework import serializers

from base.serializers import BaseModelSerializer
from social.api.v1.type_model_maps import CREATED_FOR_RESOLVER, ATTACHMENT_RESOLVER
from social.api.v1.fields import TypeModelRefField
from social.models import Publication
from users.api.v1.serializers import BaseUserSerializer


class PublicationCreateSerializer(BaseModelSerializer):
    author = serializers.HiddenField(default=serializers.CurrentUserDefault())

    created_for = TypeModelRefField(
        resolver=CREATED_FOR_RESOLVER, write_only=True, required=False, allow_null=True
    )
    attachment = TypeModelRefField(
        resolver=ATTACHMENT_RESOLVER, write_only=True, required=False, allow_null=True
    )
    parent_uuid = serializers.UUIDField(
        write_only=True, required=False, allow_null=True
    )

    class Meta(BaseModelSerializer.Meta):
        model = Publication
        fields = BaseModelSerializer.Meta.fields + [
            "author",
            "content",
            "created_for",
            "attachment",
            "parent_uuid",
        ]

    def create(self, validated_data):
        parent = None
        parent_uuid = validated_data.pop("parent_uuid", None)
        if parent_uuid:
            try:
                parent = Publication.objects.get(uuid=parent_uuid)
            except Publication.DoesNotExist:
                raise serializers.ValidationError(
                    {
                        "parent_uuid": f"Parent publication does not exist: {parent_uuid}."
                    }
                )

        if not (created_for_obj := validated_data.pop("created_for", None)):
            if not parent_uuid:
                raise serializers.ValidationError(
                    {"created_for": "Required for root publications."}
                )
            created_for_obj = parent.get_root().created_for_object

        return Publication.objects.create(
            parent=parent,
            created_for_object=created_for_obj,
            attachment_object=validated_data.pop("attachment", None),
            **validated_data,
        )


class PublicationRetrieveSerializer(BaseModelSerializer):
    author = BaseUserSerializer(read_only=True)
    root_author_uuid = serializers.UUIDField(read_only=True)

    created_for = TypeModelRefField(
        resolver=CREATED_FOR_RESOLVER, read_only=True, source="created_for_object"
    )
    attachment = TypeModelRefField(
        resolver=ATTACHMENT_RESOLVER, read_only=True, source="attachment_object"
    )
    parent_uuid = serializers.SerializerMethodField(allow_null=True, read_only=True)
    parent_author = serializers.SerializerMethodField(allow_null=True, read_only=True)
    parent_repr = serializers.SerializerMethodField(allow_null=True, read_only=True)

    class Meta(BaseModelSerializer.Meta):
        model = Publication
        fields = BaseModelSerializer.Meta.fields + [
            "author",
            "root_author_uuid",
            "content",
            "is_deleted",
            "created_for",
            "attachment",
            "parent_uuid",
            "parent_author",
            "parent_repr",
        ]

    def get_root_author_uuid(self, obj) -> str | None:
        root = obj.get_root()
        return str(root.author.uuid) if root.author else None

    def get_parent_uuid(self, obj) -> str | None:
        return str(obj.parent.uuid) if obj.parent else None

    def get_parent_author(self, obj) -> dict | None:
        return BaseUserSerializer(obj.parent.author).data if obj.parent else None

    def get_parent_repr(self, obj) -> str | None:
        return obj.parent.content if obj.parent else None


class PublicationRetrieveWithChildrenSerializer(PublicationRetrieveSerializer):
    children = serializers.SerializerMethodField()

    class Meta(PublicationRetrieveSerializer.Meta):
        fields = PublicationRetrieveSerializer.Meta.fields + ["children"]

    def get_children(self, obj):
        qs = obj.replies.all().order_by("date_added")
        serializer = PublicationRetrieveSerializer(qs, many=True, context=self.context)
        return serializer.data
