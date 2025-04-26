from django.urls import path

from notifications.api.v1.views import (
    ReplyNotificationListView,
    ReplyNotificationSetReadView,
)


urlpatterns = [
    path(
        "notifications/replies",
        ReplyNotificationListView.as_view(),
        name="notifications-replies-list",
    ),
    # TODO: make generic(changing is_read only)
    path(
        "notifications",
        ReplyNotificationSetReadView.as_view(),
        name="notifications-set-read",
    ),
]
