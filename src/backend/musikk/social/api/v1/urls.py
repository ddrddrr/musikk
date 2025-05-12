from django.urls import path

from social.api.v1.views import (
    CommentsListCreateView,
    PostListCreateView,
)

urlpatterns = [
    path(
        "comments/<str:obj_type>/<uuid:obj_uuid>",
        CommentsListCreateView.as_view(),
        name="comment-create-list",
    ),
    path(
        "posts/users/<uuid:uuid>", PostListCreateView.as_view(), name="post-list-create"
    ),
]
