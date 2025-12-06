from dj_rest_auth.registration.views import (
    RegisterView,
    VerifyEmailView,
    ResendEmailVerificationView,
)
from dj_rest_auth.views import (
    PasswordResetView,
    PasswordResetConfirmView,
    LoginView,
    LogoutView,
    PasswordChangeView,
)
from django.urls import path
from django.urls.conf import include

from users.api.v1.views import (
    UserRetrieveView,
    MeView,
    FriendsView,
    FollowersView,
    csrf,
)

dj_rest_auth_urls = [
    path("registration", RegisterView.as_view(), name="rest_register"),
    path(r"verify-email", VerifyEmailView.as_view(), name="rest_verify_email"),
    path(
        r"resend-email",
        ResendEmailVerificationView.as_view(),
        name="rest_resend_email",
    ),
    path(r"login", LoginView.as_view(), name="rest_login"),
    path(r"logout", LogoutView.as_view(), name="rest_logout"),
    path(r"password/reset", PasswordResetView.as_view(), name="rest_password_reset"),
    path(
        r"password/reset/confirm",
        PasswordResetConfirmView.as_view(),
        name="rest_password_reset_confirm",
    ),
    path(r"password/change", PasswordChangeView.as_view(), name="rest_password_change"),
]
urlpatterns = [
    path("auth/", include(dj_rest_auth_urls)),
    path("csrf", csrf),
    path(
        "users/<uuid:uuid>",
        UserRetrieveView.as_view(),
        name="user-retrieve",
    ),
    path("users/me", MeView.as_view(), name="me"),
    path(
        "users/<uuid:for_user_uuid>/friends",
        FriendsView.as_view(),
        name="user-friends",
    ),
    path(
        "users/<uuid:uuid>/followers",
        FollowersView.as_view(),
        name="user-followers",
    ),
]
