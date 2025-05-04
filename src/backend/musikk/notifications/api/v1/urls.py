from django.urls import path

from notifications.api.v1.views import (
    NotificationsPersonalListUpdateView,
    FriendRequestNotificationCreateView,
    NotificationDeleteView,
)


urlpatterns = [
    path(
        "notifications",
        NotificationsPersonalListUpdateView.as_view(),
        name="notifications-list-update",
    ),
    path(
        "notifications/friend-requests/<uuid:uuid>",
        FriendRequestNotificationCreateView.as_view(),
        name="notifications-friend-request-create",
    ),
    path(
        "notifications/<uuid:uuid>",
        NotificationDeleteView.as_view(),
        name="notifications-delete",
    ),
]
