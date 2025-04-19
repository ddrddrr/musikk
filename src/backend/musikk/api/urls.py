from django.urls import include, path
from django.urls.conf import include
import django_eventstream

app_name = "api"

v1 = [
    path("v1/", include("streaming.api.v1.urls")),
    path("v1/", include("users.api.v1.urls")),
    path("v1/", include("social.api.v1.urls")),
    # uuid is the uuid of the object to which the comment belongs
    path("v1/events/comments/<uuid>/", include(django_eventstream.urls)),
]

urlpatterns = v1
