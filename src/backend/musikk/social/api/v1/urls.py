from django.urls import path

from social.api.v1.views import CommentListCreateView

urlpatterns = [
    path("comments/", CommentListCreateView.as_view(), name="comments-create-list"),
]
