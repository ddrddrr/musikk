from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.http import HttpResponse
from django.urls import path
from django.urls.conf import include
from django.views.generic import TemplateView


def _debug_toolbar_urls():
    if "debug_toolbar" not in settings.INSTALLED_APPS:
        return []
    from debug_toolbar.toolbar import debug_toolbar_urls

    return debug_toolbar_urls()


def _health(request):
    return HttpResponse("ok", content_type="text/plain")


urlpatterns = (
    [
        path("admin/", admin.site.urls),
        path("api/", include("api.urls", namespace="api")),
        path("health/", _health, name="health"),
        # Workaround for allauth/dj-rest-auth problems
        path(
            "account-email-verification-sent/",
            TemplateView.as_view(),
            name="account_email_verification_sent",
        ),
    ]
    + _debug_toolbar_urls()
    + static(
        settings.MEDIA_URL, document_root=settings.MEDIA_ROOT
    )  # served only when DEBUG=True
)
