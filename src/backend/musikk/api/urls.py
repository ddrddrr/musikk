from django.urls import path
from django.urls.conf import include

app_name = "api"

v1 = [
    path("v1/", include("streaming.api.v1.urls")),
    path("v1/", include("users.api.v1.urls")),
    path("v1/", include("social.api.v1.urls")),
    path("v1/", include("notifications.api.v1.urls")),
]

urlpatterns = v1
