from django.urls import include, path
from debug_toolbar.toolbar import debug_toolbar_urls

app_name = "api"

urlpatterns = [
    path("v1/", include("api.v1.urls")),
]
