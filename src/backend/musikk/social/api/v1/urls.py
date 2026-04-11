from django.urls import path

from social.api.v1.views import (
    PublicationChildrenView,
    CollectionCommentsListCreateView,
    FeedPostsListCreateView,
    ChatMessagesListCreateView,
    ChatAttachmentsListView,
    UserChatsListCreateView,
    ChatMembersCreateView,
    ChatRetrieveView,
)

chat_urlpatterns = [
    path(
        "users/<uuid:user_uuid>/chats",
        UserChatsListCreateView.as_view(),
        name="user-chats-list-create",
    ),
    path(
        "users/<uuid:user_uuid>/chats/<uuid:chat_uuid>",
        ChatRetrieveView.as_view(),
        name="chat-messages-list-create",
    ),
    path(
        "users/<uuid:user_uuid>/chats/<uuid:chat_uuid>/messages",
        ChatMessagesListCreateView.as_view(),
        name="chat-messages-list-create",
    ),
    path(
        "users/<uuid:user_uuid>/chats/<uuid:chat_uuid>/attachments",
        ChatAttachmentsListView.as_view(),
        name="chat-attachments-list",
    ),
    path(
        "users/<uuid:user_uuid>/chats/<uuid:chat_uuid>/members",
        ChatMembersCreateView.as_view(),
        name="chat-members-create",
    ),
]
urlpatterns = [
    path(
        "publications/<uuid:uuid>/children",
        PublicationChildrenView.as_view(),
        name="publication-children",
    ),
    path(
        "feed/<uuid:user_uuid>/posts",  # future proofing with /posts
        FeedPostsListCreateView.as_view(),
        name="feed-list-retrieve",
    ),
    path(
        "collections/<uuid:collection_uuid>/comments",
        CollectionCommentsListCreateView.as_view(),
        name="collection-comments-list-retrieve",
    ),
] + chat_urlpatterns
