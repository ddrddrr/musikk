from django.urls import include, path

app_name = "api"

v1 = [
    path("v1/", include("streaming.api.v1.urls")),
    # path("v1/", include("users.api.v1.urls")),
]

urlpatterns = v1
