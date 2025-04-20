from django.urls import path
from django.urls.conf import include
from rest_framework.routers import DefaultRouter

from social.api.v1.views import CommentListCreateView, CommentEventViewSet

router = DefaultRouter()

# uuid is the uuid of the object to which the comment belongs
router.register(
    r"comments/events/(?P<uuid>.+)", CommentEventViewSet, basename="comment-events"
)
urlpatterns = [
    path("", include(router.urls)),
    path("comments/", CommentListCreateView.as_view(), name="comments-create-list"),
]
