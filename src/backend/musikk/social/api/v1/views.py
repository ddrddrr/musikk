from django.contrib.contenttypes.models import ContentType
from musikk.pagination import BaseLimitOffsetPagination
from notifications.models import ChatMessageNotification, ReplyNotification
from rest_framework.exceptions import PermissionDenied
from rest_framework.generics import (
    CreateAPIView,
    ListAPIView,
    ListCreateAPIView,
    RetrieveAPIView,
)
from streaming.models import Collection
from streaming.models.collections import CollectionType
from users.models import BaseUser
from websockets.event_helpers import send_ws_event
from websockets.topics import topic_group

from social.api.v1.filters import PublicationConnectionFilter
from social.api.v1.mixins import PublicationsListCreateMixin
from social.api.v1.serializers import (
    ChatAttachmentSerializer,
    ChatMembersCreateSerializer,
    PublicationChildrenSerializer,
    UserChatCreateSerializer,
    UserChatRetrieveSerializer,
)
from social.models import Publication
from social.models.chat import Chat, ChatMember
from social.ws import ServerEvent


class PublicationChildrenView(RetrieveAPIView):
    queryset = Publication.objects.all()
    serializer_class = PublicationChildrenSerializer
    lookup_field = "uuid"


class CollectionCommentsListCreateView(PublicationsListCreateMixin, ListCreateAPIView):
    filterset_class = PublicationConnectionFilter
    list_top_level_only = False

    def get_created_for(self) -> Collection:
        return Collection.objects.get(uuid=self.kwargs["collection_uuid"])

    def check_list_permission(self, created_for: Collection):
        return not created_for.private

    def check_create_permission(self, created_for: Collection):
        return not created_for.private and created_for.type in (
            CollectionType.ALBUM,
            CollectionType.PLAYLIST,
        )

    def ws_on_create(self):
        send_ws_event(
            topic_group("collection_comments", str(self.kwargs["collection_uuid"])),
            ServerEvent.COLLECTION_COMMENTS_CHANGED,
            collection_uuid=str(self.kwargs["collection_uuid"]),
        )
        if self._created_publication.parent:
            ReplyNotification.objects.create(
                orig_publication=self._created_publication.parent,
                reply_publication=self._created_publication,
            )


class FeedPostsListCreateView(PublicationsListCreateMixin, ListCreateAPIView):
    filterset_class = PublicationConnectionFilter

    def get_created_for(self):
        return BaseUser.objects.get(uuid=self.kwargs["user_uuid"])

    def get_queryset(self):
        if "user_uuid" not in self.kwargs:
            ct = ContentType.objects.get_for_model(BaseUser)
            return (
                Publication.objects.filter(created_for_type=ct, parent__isnull=True)
                .select_related("author")
                .order_by("-date_added")
            )
        return super().get_queryset()

    def check_list_permission(self, created_for):
        return True

    def check_create_permission(self, created_for):
        # top-level publications on their own feed
        # or replies anywhere
        return (
            created_for == self.request.user
            or Publication.objects.filter(
                uuid=self.request.data.get("parent_uuid")
            ).exists()
        )

    def ws_on_create(self):
        if self._created_publication.parent:
            ReplyNotification.objects.create(
                orig_publication=self._created_publication.parent,
                reply_publication=self._created_publication,
            )


class ChatMessagesListCreateView(PublicationsListCreateMixin, ListCreateAPIView):
    list_top_level_only = False

    def get_created_for(self) -> Chat:
        return Chat.objects.get(uuid=self.kwargs["chat_uuid"])

    def check_list_permission(self, created_for: Chat) -> bool:
        return ChatMember.objects.filter(
            chat=created_for, member=self.request.user
        ).exists()

    def check_create_permission(self, created_for: Chat) -> bool:
        return ChatMember.objects.filter(
            chat=created_for, member=self.request.user
        ).exists()

    def ws_on_create(self):
        chat_uuid = str(self.kwargs["chat_uuid"])
        send_ws_event(
            topic_group("chat", chat_uuid),
            ServerEvent.CHAT_MESSAGES_CHANGED,
            chat_uuid=chat_uuid,
        )
        chat = self.get_created_for()
        other_members = ChatMember.objects.filter(chat=chat).exclude(
            member=self.request.user
        )
        for cm in other_members:
            ChatMessageNotification.objects.create(
                message=self._created_publication,
                chat=chat,
                receiver=cm.member,
            )


class UserChatsListCreateView(ListCreateAPIView):
    def get_serializer_class(self):
        if self.request.method == "POST":
            return UserChatCreateSerializer
        return UserChatRetrieveSerializer

    def get_queryset(self):
        return Chat.objects.filter(
            id__in=ChatMember.objects.filter(member=self.request.user).values_list(
                "chat_id", flat=True
            )
        ).prefetch_related("chatmember_set__member")


class ChatMembersCreateView(CreateAPIView):
    serializer_class = ChatMembersCreateSerializer


# TODO: remove, the chats are pre-retrieved I guess
class ChatRetrieveView(RetrieveAPIView):
    serializer_class = UserChatRetrieveSerializer
    lookup_field = "uuid"
    lookup_url_kwarg = "chat_uuid"

    def get_queryset(self):
        return Chat.objects.filter(
            id__in=ChatMember.objects.filter(member=self.request.user).values_list(
                "chat_id", flat=True
            )
        ).prefetch_related("chatmember_set__member")


class ChatAttachmentsListView(ListAPIView):
    serializer_class = ChatAttachmentSerializer
    pagination_class = BaseLimitOffsetPagination

    def get_queryset(self):
        chat = Chat.objects.get(uuid=self.kwargs["chat_uuid"])
        if not ChatMember.objects.filter(chat=chat, member=self.request.user).exists():
            raise PermissionDenied()
        ct = ContentType.objects.get_for_model(chat)
        return (
            Publication.objects.filter(
                created_for_type=ct,
                created_for_id=chat.pk,
                attachment_type__isnull=False,
            )
            .select_related("attachment_type")
            .order_by("-date_added")
        )
