from django.urls import path

from notifications.api.v1.views import (
    NotificationsPersonalListUpdateView,
    NotificationDeleteView,
)


urlpatterns = [
    path(
        "notifications",
        NotificationsPersonalListUpdateView.as_view(),
        name="notifications-list-update",
    ),
    path(
        "notifications/<uuid:uuid>",
        NotificationDeleteView.as_view(),
        name="notifications-delete",
    ),
]
