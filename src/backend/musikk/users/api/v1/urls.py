from dj_rest_auth.registration.views import (
    RegisterView,
    ResendEmailVerificationView,
    VerifyEmailView,
)
from dj_rest_auth.views import (
    LoginView,
    LogoutView,
    PasswordChangeView,
    PasswordResetConfirmView,
    PasswordResetView,
)
from django.urls import path
from django.urls.conf import include

from users.api.v1.views import (
    FollowedView,
    FollowersView,
    FriendsView,
    MeView,
    RegistrationSettingsView,
    UserRetrieveView,
    csrf,
    media_access,
)

dj_rest_auth_urls = [
    path("registration", RegisterView.as_view(), name="rest_register"),
    path(
        "registration/settings",
        RegistrationSettingsView.as_view(),
        name="registration-settings",
    ),
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
    path("media-access", media_access, name="media-access"),
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
        "users/<uuid:for_user_uuid>/followers",
        FollowersView.as_view(),
        name="user-followers",
    ),
    path(
        "users/<uuid:for_user_uuid>/followed",
        FollowedView.as_view(),
        name="user-followed",
    ),
]
