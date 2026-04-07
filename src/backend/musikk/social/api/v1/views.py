from rest_framework.generics import (
    RetrieveAPIView,
    ListCreateAPIView,
    CreateAPIView,
)

from social.api.v1.filters import PublicationConnectionFilter
from social.api.v1.mixins import PublicationsListCreateMixin
from social.api.v1.serializers import (
    PublicationChildrenSerializer,
    UserChatRetrieveSerializer,
    UserChatCreateSerializer,
    ChatMembersCreateSerializer,
)
from social.models import Publication
from social.models.chat import Chat, ChatMember
from streaming.models import Collection
from streaming.models.collections import CollectionType
from users.models import BaseUser
from websockets.event_helpers import send_ws_event, user_group


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
        return created_for.private == False

    def check_create_permission(self, created_for: Collection):
        return created_for.private == False and created_for.type in (
            CollectionType.ALBUM,
            CollectionType.PLAYLIST,
        )

    def ws_on_create(self):
        send_ws_event(
            user_group(self.request.user.uuid),
            "collection.comments.changed",
            collection_uuid=str(self.kwargs["collection_uuid"]),
        )


class FeedPostsListCreateView(PublicationsListCreateMixin, ListCreateAPIView):
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
            user_group(self.request.user.uuid),
            "feed.comments.changed",
            user_uuid=str(self.kwargs["user_uuid"]),
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
        send_ws_event(
            user_group(self.request.user.uuid),
            "chat.messages.changed",
            chat_uuid=str(self.kwargs["chat_uuid"]),
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
