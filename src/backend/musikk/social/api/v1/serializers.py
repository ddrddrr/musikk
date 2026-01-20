from rest_framework import serializers
from django.db import transaction

from base.serializers import BaseModelSerializer, UUIDListField
from social.api.v1.type_model_maps import ATTACHMENT_RESOLVER
from social.api.v1.fields import TypeModelRefField
from social.models import Publication
from social.models.chat import Chat, ChatMember
from social.api.v1.validators import validate_participants_are_friends
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
            if not (
                validated_data["created_for_object"].__class__
                is parent.get_root().created_for_object.__class__
            ):
                raise serializers.ValidationError(
                    {
                        "parent": "The publication's created_for object does not match root's created_for object. "
                        "This can happen, e.g., when the parent's UUID is incorrect."
                    }
                )

        return Publication.objects.create(
            parent=parent,
            attachment_object=validated_data.pop("attachment", None),
            **validated_data,
        )


class PublicationRetrieveSerializer(BaseModelSerializer):
    author = BaseUserSerializer(read_only=True)
    root_author_uuid = serializers.SerializerMethodField(read_only=True)

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


class PublicationChildrenSerializer(BaseModelSerializer):
    children = serializers.SerializerMethodField()

    class Meta(PublicationRetrieveSerializer.Meta):
        model = Publication
        fields = ["children"]

    def get_children(self, obj):
        qs = obj.replies.all().order_by("date_added")
        serializer = PublicationRetrieveSerializer(qs, many=True, context=self.context)
        return serializer.data


class UserChatRetrieveSerializer(BaseModelSerializer):
    user = serializers.HiddenField(default=serializers.CurrentUserDefault())

    title = serializers.CharField(read_only=True)
    image = serializers.ImageField(allow_null=True, read_only=True)
    last_message = serializers.SerializerMethodField(allow_null=True)
    is_read = serializers.SerializerMethodField()

    class Meta(BaseModelSerializer.Meta):
        model = Chat
        fields = BaseModelSerializer.Meta.fields + [
            "user",
            "title",
            "image",
            "last_message",
            "is_read",
        ]

    def to_representation(self, instance):
        self._last_pub = (
            Publication.objects.filter(created_for_object=instance)
            .order_by("-date_added")
            .first()
        )
        return super().to_representation(instance)

    def get_last_message(self, obj):
        pub = getattr(self, "_last_pub", None)
        return (
            PublicationRetrieveSerializer(pub, context=self.context).data
            if pub
            else None
        )

    def get_is_read(self, obj):
        if not (pub := getattr(self, "_last_pub", None)):
            return True

        cm = ChatMember.objects.get(
            chat=obj,
            member=self.validated_data["user"],
        )
        return cm.last_read_message == pub


class UserChatCreateSerializer(BaseModelSerializer):
    user = serializers.HiddenField(default=serializers.CurrentUserDefault())

    participants = UUIDListField(write_only=True)
    is_direct = serializers.BooleanField(write_only=True)
    title = serializers.CharField(write_only=True, required=False, allow_blank=True)
    image = serializers.ImageField(write_only=True, required=False, allow_null=True)

    class Meta(BaseModelSerializer.Meta):
        model = Chat
        fields = BaseModelSerializer.Meta.fields + [
            "user",
            "participants",
            "title",
            "image",
            "is_direct",
        ]

    def validate(self, attrs):
        participants = set(attrs.get("participants", []))
        is_direct = attrs.get("is_direct", False)
        user = attrs.get("user")

        if is_direct and len(participants) != 1:
            raise serializers.ValidationError(
                {"participants": "Direct chat requires exactly 1 participant."}
            )

        if user.uuid in participants:
            raise serializers.ValidationError(
                {"participants": "Cannot create a chat with yourself."}
            )

        return attrs

    def create(self, validated_data):
        participants = list(validated_data.pop("participants"))
        user = validated_data["user"]

        filtered_friends = validate_participants_are_friends(user, participants)
        if validated_data["is_direct"]:
            validated_data["title"] = filtered_friends[0].display_name

        with transaction.atomic():
            chat = Chat.objects.create(**validated_data)
            ChatMember.objects.bulk_create(
                [ChatMember(chat=chat, member=f) for f in filtered_friends]
                + [ChatMember(chat=chat, member=user)],
                ignore_conflicts=True,
            )
            return chat


class ChatMembersCreateSerializer(BaseModelSerializer):
    user = serializers.HiddenField(default=serializers.CurrentUserDefault())

    chat = serializers.UUIDField(write_only=True)
    participants = UUIDListField(write_only=True)

    class Meta(BaseModelSerializer.Meta):
        model = Chat
        fields = BaseModelSerializer.Meta.fields + ["user", "participants", "chat"]

    def create(self, validated_data):
        try:
            cm = ChatMember.objects.prefetch_related("chat").get(
                chat__uuid=validated_data["chat"], member=validated_data["user"]
            )
        except Exception:
            raise serializers.ValidationError(
                # TODO: consolidate err msg style (see what's better first - with keys or without)
                "Could not add new Users to the Chat. The request User is not a member of the provided Chat"
            )

        if cm.chat.is_direct:
            raise serializers.ValidationError(
                "It is forbidden to add more members to a direct Chat"
            )

        participants = list(validated_data.pop("participants"))
        user = validated_data["user"]

        filtered_friends = validate_participants_are_friends(user, participants)

        ChatMember.objects.bulk_create(
            [ChatMember(chat=cm.chat, member=f) for f in filtered_friends],
            ignore_conflicts=True,
        )

        return cm.chat
