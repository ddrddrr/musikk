from rest_framework.generics import (
    RetrieveAPIView,
    GenericAPIView,
    ListCreateAPIView,
    CreateAPIView,
)

from social.api.v1.filters import PublicationConnectionFilter
from social.api.v1.mixins import PublicationsListCreateMixin
from social.api.v1.serializers import (
    PublicationRetrieveWithChildrenSerializer,
    UserChatRetrieveSerializer,
    UserChatCreateSerializer,
    ChatMembersCreateSerializer,
)
from social.models import Publication
from social.models.chat import Chat, ChatMember
from streaming.models import Collection
from streaming.models.collections import CollectionType
from users.models import BaseUser
from websockets.event_helpers import send_ws_event


class PublicationRetrieveView(RetrieveAPIView):
    queryset = Publication.objects.select_related("author", "parent").prefetch_related(
        "replies__author"
    )
    serializer_class = PublicationRetrieveWithChildrenSerializer
    lookup_field = "uuid"


class CollectionCommentsListCreateView(PublicationsListCreateMixin, GenericAPIView):
    filterset_class = PublicationConnectionFilter

    def get_created_for(self) -> Collection:
        return Collection.objects.get(uuid=self.kwargs["collection_uuid"])

    def check_list_permission(self, created_for: Collection):
        return created_for.private == False

    def check_create_permission(self, created_for: Collection):
        return created_for.private == False and created_for.type in (
            CollectionType.ALBUM,
            CollectionType.PLAYLIST,
        )

    def ws_on_create(self):
        send_ws_event(
            f"user_{self.request.user.uuid}",
            event_name="invalidate.query",
            query_key=[
                "collection",
                self.kwargs["collection_uuid"],
                "comments",
            ],
        )


class FeedPostsListCreateView(PublicationsListCreateMixin, GenericAPIView):
    filterset_class = PublicationConnectionFilter

    def get_created_for(self):
        return BaseUser.objects.get(uuid=self.kwargs["user_uuid"])

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
        send_ws_event(
            f"user_{self.request.user.uuid}",
            event_name="invalidate.query",
            query_key=[
                "feed",
                self.kwargs["user_uuid"],
                "comments",
            ],
        )


class ChatMessagesListCreateView(PublicationsListCreateMixin, GenericAPIView):
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
        send_ws_event(
            f"user_{self.request.user.uuid}",
            event_name="invalidate.query",
            query_key=[
                "chat",
                self.kwargs["chat_uuid"],
                "messages",
            ],
        )


class UserChatsListCreateView(ListCreateAPIView):
    def get_serializer_class(self):
        if self.request.method == "POST":
            return UserChatCreateSerializer
        return UserChatRetrieveSerializer

    def get_queryset(self):
        return [
            cm.chat
            for cm in ChatMember.objects.filter(
                member=self.request.user
            ).select_related("chat")
        ]


class ChatMembersCreateView(CreateAPIView):
    serializer_class = ChatMembersCreateSerializer
