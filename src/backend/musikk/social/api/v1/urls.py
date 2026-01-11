from django.urls import path

from social.api.v1.views import (
    PublicationListCreateForObjView,
    PublicationRetrieveView,
    PublicationFeedView,
)

urlpatterns = [
    path(
        "publications/<str:obj_type>/<uuid:obj_uuid>",
        PublicationListCreateForObjView.as_view(),
        name="publication-create-list-for-obj",
    ),
    path(
        "publications/<uuid:uuid>",
        PublicationRetrieveView.as_view(),
        name="publication-retrieve",
    ),
    path(
        "publications/feed",
        PublicationFeedView.as_view(),
        name="publication-feed-latest",
    ),
]
