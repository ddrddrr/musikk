from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.http import HttpResponse
from django.urls import path
from django.urls.conf import include
from django.utils.cache import patch_cache_control
from django.views.generic import TemplateView
from django.views.static import serve
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView


def _health(request):
    return HttpResponse("ok", content_type="text/plain")


def _serve_media(request, path, document_root):
    """
    Serves media in development with the same login check and cache headers that Caddy gives
    in production, so a page that loads media without a session fails in development too.
    """
    if not request.user.is_authenticated:
        return HttpResponse(status=401)
    response = serve(request, path, document_root=document_root)
    patch_cache_control(response, private=True, no_cache=True)
    return response


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
    settings.MEDIA_URL, view=_serve_media, document_root=settings.MEDIA_ROOT
)  # served only when DEBUG=True

if settings.DEBUG:
    urlpatterns += [
        path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
        path(
            "api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="docs"
        ),
    ]
