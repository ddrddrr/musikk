from django.contrib.contenttypes.models import ContentType
from drf_spectacular.utils import extend_schema, extend_schema_view
from musikk.pagination import BaseLimitOffsetPagination
from notifications.models import ChatMessageNotification, ReplyNotification
from rest_framework.exceptions import PermissionDenied
from rest_framework.generics import (
    CreateAPIView,
    ListAPIView,
    ListCreateAPIView,
    RetrieveAPIView,
    get_object_or_404,
)
from users.models import BaseUser
from websockets.event_helpers import send_ws_event, user_group
from websockets.topics import topic_group

from social.api.v1.filters import PublicationConnectionFilter
from social.api.v1.mixins import PUBLICATION_CREATE_SCHEMA, PublicationsListCreateMixin
from social.api.v1.permissions import can_read_thread_of
from social.api.v1.serializers import (
    ChatAttachmentSerializer,
    ChatMembersCreateSerializer,
    PublicationChildrenSerializer,
    PublicationRetrieveSerializer,
    UserChatCreateSerializer,
    UserChatRetrieveSerializer,
    attachment_schema,
)
from social.models import Publication
from social.models.chat import Chat, ChatMember
from social.publication_access_policies import (
    ChatPublicationAccessPolicy,
    CollectionPublicationAccessPolicy,
    FeedPublicationAccessPolicy,
    SongPublicationAccessPolicy,
)
from social.ws import ServerEvent


class PublicationChildrenView(RetrieveAPIView):
    queryset = Publication.objects.all()
    serializer_class = PublicationChildrenSerializer
    lookup_field = "uuid"

    def get_object(self):
        publication = super().get_object()
        if not can_read_thread_of(self.request.user, publication):
            raise PermissionDenied()
        return publication


class CommentsListCreateView(PublicationsListCreateMixin, ListCreateAPIView):
    """
    Comments on an object that other users can see, such as an album. A new
    comment sends `comments_changed_event` on the object's WebSocket topic, so
    open comment threads refetch. The payload carries the object's uuid under
    the URL kwarg name, for example `collection_uuid`. A reply also creates a
    reply notification for the author of the parent comment.
    """

    filterset_class = PublicationConnectionFilter
    list_top_level_only = False
    comments_changed_event: ServerEvent

    def ws_on_create(self):
        created_for_uuid = str(self.kwargs[self.created_for_url_kwarg])
        send_ws_event(
            topic_group(self.access_policy.ws_topic_prefix, created_for_uuid),
            self.comments_changed_event,
            **{self.created_for_url_kwarg: created_for_uuid},
        )
        if self._created_publication.parent:
            ReplyNotification.objects.create(
                orig_publication=self._created_publication.parent,
                reply_publication=self._created_publication,
            )


@PUBLICATION_CREATE_SCHEMA
class CollectionCommentsListCreateView(CommentsListCreateView):
    access_policy = CollectionPublicationAccessPolicy()
    created_for_url_kwarg = "collection_uuid"
    comments_changed_event = ServerEvent.COLLECTION_COMMENTS_CHANGED


@PUBLICATION_CREATE_SCHEMA
class SongCommentsListCreateView(CommentsListCreateView):
    access_policy = SongPublicationAccessPolicy()
    created_for_url_kwarg = "song_uuid"
    comments_changed_event = ServerEvent.SONG_COMMENTS_CHANGED


class GlobalFeedPostsListView(ListAPIView):
    serializer_class = PublicationRetrieveSerializer
    pagination_class = BaseLimitOffsetPagination
    filterset_class = PublicationConnectionFilter

    def get_queryset(self):
        feed_type = ContentType.objects.get_for_model(BaseUser)
        return (
            Publication.objects.filter(created_for_type=feed_type, parent__isnull=True)
            .select_related("author")
            .order_by("-date_added")
        )


@PUBLICATION_CREATE_SCHEMA
class FeedPostsListCreateView(PublicationsListCreateMixin, ListCreateAPIView):
    filterset_class = PublicationConnectionFilter
    access_policy = FeedPublicationAccessPolicy()
    created_for_url_kwarg = "user_uuid"

    def ws_on_create(self):
        if self._created_publication.parent:
            ReplyNotification.objects.create(
                orig_publication=self._created_publication.parent,
                reply_publication=self._created_publication,
            )


@PUBLICATION_CREATE_SCHEMA
class ChatMessagesListCreateView(PublicationsListCreateMixin, ListCreateAPIView):
    list_top_level_only = False
    access_policy = ChatPublicationAccessPolicy()
    created_for_url_kwarg = "chat_uuid"

    def ws_on_create(self):
        chat_uuid = str(self.kwargs["chat_uuid"])
        send_ws_event(
            topic_group(self.access_policy.ws_topic_prefix, chat_uuid),
            ServerEvent.CHAT_MESSAGES_CHANGED,
            chat_uuid=chat_uuid,
        )
        chat = self.get_created_for()
        other_members = ChatMember.objects.filter(chat=chat).exclude(
            member=self.request.user
        )
        for cm in other_members:
            send_ws_event(
                user_group(cm.member.uuid),
                ServerEvent.CHAT_MESSAGES_CHANGED,
                chat_uuid=chat_uuid,
            )
            ChatMessageNotification.objects.create(
                message=self._created_publication,
                chat=chat,
                receiver=cm.member,
            )


class UserChatsListCreateView(ListCreateAPIView):
    queryset = Chat.objects.none()

    def get_serializer_class(self):
        if self.request.method == "POST":
            return UserChatCreateSerializer
        return UserChatRetrieveSerializer

    def get_queryset(self):
        return Chat.objects.filter(
            pk__in=ChatMember.objects.filter(member=self.request.user).values_list(
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
            pk__in=ChatMember.objects.filter(member=self.request.user).values_list(
                "chat_id", flat=True
            )
        ).prefetch_related("chatmember_set__member")


@extend_schema_view(get=extend_schema(responses=attachment_schema(many=True)))
class ChatAttachmentsListView(ListAPIView):
    queryset = Publication.objects.none()
    serializer_class = ChatAttachmentSerializer
    pagination_class = BaseLimitOffsetPagination
    access_policy = ChatPublicationAccessPolicy()

    def get_queryset(self):
        chat = get_object_or_404(Chat, uuid=self.kwargs["chat_uuid"])
        if not self.access_policy.can_read_publications(self.request.user, chat):
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
