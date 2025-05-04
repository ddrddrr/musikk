from django.urls import path

from notifications.api.v1.views import (
    NotificationListView,
    ReplyNotificationSetReadView,
    FriendRequestNotificationCreateView,
)


urlpatterns = [
    path(
        "notifications",
        NotificationListView.as_view(),
        name="notifications-list",
    ),
    # TODO: make generic(changing is_read only)
    path(
        "notifications/replies",
        ReplyNotificationSetReadView.as_view(),
        name="notifications-set-read",
    ),
    path(
        "notifications/friend-requests",
        FriendRequestNotificationCreateView.as_view(),
        name="notifications-friend-request-create",
    ),
]
