from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.http import HttpResponse
from django.urls import path
from django.urls.conf import include
from django.views.generic import TemplateView
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView


def _health(request):
    return HttpResponse("ok", content_type="text/plain")


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("api.urls", namespace="api")),
    path("health/", _health, name="health"),
    # Workaround for allauth/dj-rest-auth problems
    path(
        "account-email-verification-sent/",
        TemplateView.as_view(),
        name="account_email_verification_sent",
    ),
] + static(
    settings.MEDIA_URL, document_root=settings.MEDIA_ROOT
)  # served only when DEBUG=True

if settings.DEBUG:
    urlpatterns += [
        path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
        path(
            "api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="docs"
        ),
    ]
