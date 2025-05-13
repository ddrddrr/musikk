from django.urls import path

from social.api.v1.views import (
    CommentsListCreateView,
    PostCreateView,
    PostUserListView,
    PostsLatestFollowedView,
    PostChildrenListView,
    PostRetrieveView,
)

urlpatterns = [
    path(
        "comments/<str:obj_type>/<uuid:obj_uuid>",
        CommentsListCreateView.as_view(),
        name="comment-create-list",
    ),
    path("posts", PostCreateView.as_view(), name="post-create"),
    path("posts/users/<uuid:uuid>", PostUserListView.as_view(), name="post-user-list"),
    path(
        "posts/<uuid:uuid>",
        PostRetrieveView.as_view(),
        name="post-retrieve",
    ),
    path(
        "posts/<uuid:uuid>/children",
        PostChildrenListView.as_view(),
        name="post-children-list",
    ),
    path(
        "posts/followed/latest",
        PostsLatestFollowedView.as_view(),
        name="post-followed-latest",
    ),
    path(
        "posts/friends/latest",
        PostsLatestFollowedView.as_view(),
        name="post-friends-latest",
    ),
]
