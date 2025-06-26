from debug_toolbar.toolbar import debug_toolbar_urls
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path
from django.urls.conf import include
from django.views.generic import TemplateView

urlpatterns = (
    [
        path("admin/", admin.site.urls),
        path("api/", include("api.urls", namespace="api")),
        # Workaround for allauth/dj-rest-auth problems
        path(
            "account-email-verification-sent/",
            TemplateView.as_view(),
            name="account_email_verification_sent",
        ),
    ]
    + debug_toolbar_urls()
    + static(
        settings.MEDIA_URL, document_root=settings.MEDIA_ROOT
    )  # served only when DEBUG=True
)
