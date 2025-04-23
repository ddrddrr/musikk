from django.urls import path
from django.urls.conf import include
from rest_framework.routers import DefaultRouter

from notifications.api.v1.views import (
    ReplyNotificationListView,
    ReplyNotificationEventViewSet,
    ReplyNotificationSetReadView,
)

router = DefaultRouter()

# uuid is the uuid of the user
router.register(
    r"notifications/replies/events/(?P<uuid>.+)",
    ReplyNotificationEventViewSet,
    basename="comment-events",
)
urlpatterns = [
    path("", include(router.urls)),
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
