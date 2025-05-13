from django.contrib.auth.views import LogoutView
from django.urls import path
from django.urls.conf import include
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from rest_framework.routers import DefaultRouter

from users.api.v1.views import (
    ResetPasswordView,
    UserEventViewSet,
    UserCreateView,
    UserRetrieveUpdateView,
    UserFriendsView,
    ArtistFollowersView,
    UserFriendsCreateDeleteView,
    UserFollowedView,
)

router = DefaultRouter()
router.register(
    r"events/user",
    UserEventViewSet,
    basename="events-user",
)
urlpatterns = [
    path("", include(router.urls)),
    path("users", UserCreateView.as_view(), name="user-create"),
    path(
        "users/<uuid:uuid>",
        UserRetrieveUpdateView.as_view(),
        name="user-update-retrieve",
    ),
    path(
        "users/<uuid:uuid>/friends",
        UserFriendsView.as_view(),
        name="user-friends",
    ),
    path(
        "users/<uuid:uuid>/followed",
        UserFollowedView.as_view(),
        name="user-followed",
    ),
    path(
        "users/<uuid:user_uuid>/friends/<uuid:friend_uuid>",
        UserFriendsCreateDeleteView.as_view(),
        name="accept-to-friends",
    ),
    path(
        "users/artists/<uuid:uuid>/followers",
        ArtistFollowersView.as_view(),
        name="artist-followers",
    ),
    path("token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path(
        "reset-password/<uuid:uuid>/<str:token>/",
        ResetPasswordView.as_view(),
        name="reset-password",
    ),
]
