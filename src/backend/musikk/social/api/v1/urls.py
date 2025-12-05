from django.urls import path

from social.api.v1.views import (
    PublicationsListCreateView,
)

urlpatterns = [
    path(
        "publications/<str:obj_type>/<uuid:obj_uuid>",
        PublicationsListCreateView.as_view(),
        name="publication-create-list",
    ),
]
