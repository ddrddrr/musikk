from rest_framework import serializers

from base.serializers import BaseModelSerializer
from social.api.v1.type_model_maps import CREATED_FOR_RESOLVER, ATTACHMENT_RESOLVER
from social.api.v1.fields import TypeModelRefField
from social.models import Publication
from users.api.v1.serializers import BaseUserSerializer


class PublicationCreateSerializer(BaseModelSerializer):
    author = serializers.HiddenField(default=serializers.CurrentUserDefault())

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

        # TODO: add validation that it is the same as for parent if parent exists
        created_for_obj = self.context.get("created_for_obj")
        if not created_for_obj:
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
    root_author_uuid = serializers.SerializerMethodField(read_only=True)

    created_for = TypeModelRefField(
        resolver=CREATED_FOR_RESOLVER, read_only=True, source="created_for_object"
    )
    attachment = serializers.SerializerMethodField(read_only=True)
    parent_uuid = serializers.SerializerMethodField(allow_null=True, read_only=True)
    parent_author = serializers.SerializerMethodField(allow_null=True, read_only=True)
    parent_repr = serializers.SerializerMethodField(allow_null=True, read_only=True)
    has_children = serializers.SerializerMethodField(read_only=True)

    class Meta(BaseModelSerializer.Meta):
        model = Publication
        fields = BaseModelSerializer.Meta.fields + [
            "author",
            "root_author_uuid",
            "content",
            "is_deleted",
            "created_for",
            "attachment",
            # TODO: probably make a single obj
            "parent_uuid",
            "parent_author",
            "parent_repr",
            "has_children",
        ]

    def get_root_author_uuid(self, obj) -> str | None:
        root = obj.get_root()
        return str(root.author.uuid) if root.author else None

    def get_attachment(self, obj) -> dict | None:
        if not obj.attachment_object:
            return None

        return ATTACHMENT_RESOLVER.serialize_model_instance(
            obj.attachment_object, context=self.context
        )

    def get_parent_uuid(self, obj) -> str | None:
        return str(obj.parent.uuid) if obj.parent else None

    def get_parent_author(self, obj) -> dict | None:
        return BaseUserSerializer(obj.parent.author).data if obj.parent else None

    def get_parent_repr(self, obj) -> str | None:
        return obj.parent.content[:100] if obj.parent else None

    def get_has_children(self, obj) -> bool:
        return obj.replies.exists()


class PublicationRetrieveWithChildrenSerializer(PublicationRetrieveSerializer):
    children = serializers.SerializerMethodField()

    class Meta(PublicationRetrieveSerializer.Meta):
        fields = PublicationRetrieveSerializer.Meta.fields + ["children"]

    def get_children(self, obj):
        qs = obj.replies.all().order_by("date_added")
        serializer = PublicationRetrieveSerializer(qs, many=True, context=self.context)
        return serializer.data
