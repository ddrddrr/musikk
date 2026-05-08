from django.urls.conf import path

from recommendations.api.v1.views import SearchView

urlpatterns = [
    path("search", SearchView.as_view(), name="search"),
]
