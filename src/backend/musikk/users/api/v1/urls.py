from django.contrib.auth.views import LogoutView
from django.urls import path
from django.urls.conf import include
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from rest_framework.routers import DefaultRouter

from users.api.v1.views import BaseUserRetrieveView, ResetPasswordView, UserEventViewSet

router = DefaultRouter()
router.register(
    r"events/user",
    UserEventViewSet,
    basename="events-user",
)
urlpatterns = [
    path("", include(router.urls)),
    path("user/<uuid:uuid>", BaseUserRetrieveView.as_view(), name="user-detail"),
    path("token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path(
        "reset-password/<uuid:uuid>/<str:token>/",
        ResetPasswordView.as_view(),
        name="reset-password",
    ),
]
