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
from django.urls.conf import include, re_path
from rest_framework.routers import DefaultRouter

from users.api.v1.views import (
    UserEventViewSet,
    UserRetrieveView,
    UserFriendsView,
    ArtistFollowersView,
    UserFriendsView,
    csrf,
    MeView,
)

sse_router = DefaultRouter()
sse_router.register(
    r"events/user",
    UserEventViewSet,
    basename="events-user",
)
dj_rest_auth_urls = [
    # URLs that do not require a session or valid token
    re_path(
        r"password/reset/?$", PasswordResetView.as_view(), name="rest_password_reset"
    ),
    re_path(
        r"password/reset/confirm/?$",
        PasswordResetConfirmView.as_view(),
        name="rest_password_reset_confirm",
    ),
    re_path(r"login/?$", LoginView.as_view(), name="rest_login"),
    # URLs that require a user to be logged in with a valid session / token.
    re_path(r"logout/?$", LogoutView.as_view(), name="rest_logout"),
    re_path(
        r"password/change/?$", PasswordChangeView.as_view(), name="rest_password_change"
    ),
    path("registration/", RegisterView.as_view(), name="rest_register"),
    re_path(r"verify-email/?$", VerifyEmailView.as_view(), name="rest_verify_email"),
    re_path(
        r"resend-email/?$",
        ResendEmailVerificationView.as_view(),
        name="rest_resend_email",
    ),
]
urlpatterns = [
    path("", include(sse_router.urls)),
    path("auth/", include(dj_rest_auth_urls)),
    path(
        "users/<uuid:uuid>",
        UserRetrieveView.as_view(),
        name="user-retrieve",
    ),
    path("users/me", MeView.as_view(), name="me"),
    path(
        "users/<uuid:uuid>/friends",
        UserFriendsView.as_view(),
        name="user-friends",
    ),
    # path(
    #     "users/<uuid:uuid>/followed",
    #     UserFollowedView.as_view(),
    #     name="user-followed",
    # ),
    path(
        "users/<uuid:user_uuid>/friends/<uuid:friend_uuid>",
        UserFriendsView.as_view(),
        name="accept-to-friends",
    ),
    path(
        "users/artists/<uuid:uuid>/followers",
        ArtistFollowersView.as_view(),
        name="artist-followers",
    ),
    path("csrf", csrf),
]
