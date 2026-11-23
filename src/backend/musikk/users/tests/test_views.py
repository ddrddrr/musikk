from unittest.mock import patch

from django.test import TestCase, override_settings
from django.urls import reverse
from rest_framework.test import APIRequestFactory, force_authenticate

from users.api.v1.views import FollowedView, FollowersView, FriendsView, MeView
from users.models import BaseUser, UserFollow
from users.tests.factories import BaseUserFactory

NEW_ACCOUNT = {
    "email": "new.user@example.com",
    "password1": "Slow-Turtle-482",
    "password2": "Slow-Turtle-482",
}


class TestConnectionListViews(TestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.factory = APIRequestFactory()

    def setUp(self):
        # me follows: friend (mutual), one_way_followed (one-way)
        # follows me: friend, one_way_follower (one-way)
        self.me = BaseUserFactory()
        self.friend = BaseUserFactory()
        self.one_way_followed = BaseUserFactory()
        self.one_way_follower = BaseUserFactory()
        self.unrelated = BaseUserFactory()

        UserFollow.objects.create(from_user=self.me, to_user=self.friend)
        UserFollow.objects.create(from_user=self.friend, to_user=self.me)

        UserFollow.objects.create(from_user=self.me, to_user=self.one_way_followed)
        UserFollow.objects.create(from_user=self.one_way_follower, to_user=self.me)

    def _get(self, view_cls, url_name, target_user):
        url = reverse(f"api:{url_name}", kwargs={"for_user_uuid": target_user.uuid})
        request = self.factory.get(url)
        force_authenticate(request, user=self.me)
        return view_cls.as_view()(request, for_user_uuid=target_user.uuid)

    def test_friends_returns_only_mutual_follows(self):
        response = self._get(FriendsView, "user-friends", self.me)
        self.assertEqual(response.status_code, 200)
        uuids = {item["uuid"] for item in response.data["friends"]}
        self.assertEqual(uuids, {str(self.friend.uuid)})

    def test_followed_returns_everyone_followed_including_friends(self):
        response = self._get(FollowedView, "user-followed", self.me)
        self.assertEqual(response.status_code, 200)
        uuids = {item["uuid"] for item in response.data["followed"]}
        self.assertEqual(
            uuids, {str(self.friend.uuid), str(self.one_way_followed.uuid)}
        )

    def test_followers_returns_everyone_following_including_friends(self):
        response = self._get(FollowersView, "user-followers", self.me)
        self.assertEqual(response.status_code, 200)
        uuids = {item["uuid"] for item in response.data["followers"]}
        self.assertEqual(
            uuids, {str(self.friend.uuid), str(self.one_way_follower.uuid)}
        )


@patch("users.api.v1.views.send_ws_event")
class TestMeUpdateView(TestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.factory = APIRequestFactory()

    def test_patch_clears_the_bio(self, _mock_ws):
        me = BaseUserFactory(bio="Old bio")
        request = self.factory.patch(reverse("api:me"), {"bio": ""}, format="multipart")
        force_authenticate(request, user=me)

        response = MeView.as_view()(request)

        self.assertEqual(response.status_code, 200)
        me.refresh_from_db()
        self.assertEqual(me.bio, "")

    def test_patch_turns_off_loudness_normalization(self, _mock_ws):
        me = BaseUserFactory()
        patch_request = self.factory.patch(
            reverse("api:me"), {"loudness_normalization": "false"}, format="multipart"
        )
        force_authenticate(patch_request, user=me)
        patch_response = MeView.as_view()(patch_request)

        me.refresh_from_db()
        get_request = self.factory.get(reverse("api:me"))
        force_authenticate(get_request, user=me)
        get_response = MeView.as_view()(get_request)

        self.assertEqual(patch_response.status_code, 200)
        self.assertFalse(get_response.data["me"]["loudness_normalization"])


class TestMediaAccessView(TestCase):
    def test_allows_a_logged_in_user(self):
        self.client.force_login(BaseUserFactory())

        response = self.client.get(reverse("api:media-access"))

        self.assertEqual(response.status_code, 204)

    def test_rejects_an_anonymous_user(self):
        response = self.client.get(reverse("api:media-access"))

        self.assertEqual(response.status_code, 401)


class TestRegistrationSignupPassword(TestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.url = reverse("api:rest_register")

    def _register(self, **extra):
        return self.client.post(
            self.url, {**NEW_ACCOUNT, **extra}, content_type="application/json"
        )

    def _account_exists(self):
        return BaseUser.objects.filter(email=NEW_ACCOUNT["email"]).exists()

    @override_settings(SIGNUP_PASSWORD="")
    def test_signs_up_without_a_password_when_none_is_set(self):
        self._register()

        self.assertTrue(self._account_exists())

    @override_settings(SIGNUP_PASSWORD="demo-password")
    def test_signs_up_with_the_right_password(self):
        self._register(signup_password="demo-password")

        self.assertTrue(self._account_exists())

    @override_settings(SIGNUP_PASSWORD="demo-password")
    def test_rejects_a_wrong_password(self):
        response = self._register(signup_password="wrong-password")

        self.assertEqual(response.status_code, 400)
        self.assertIn("signup_password", response.json()["errors"])
        self.assertFalse(self._account_exists())

    @override_settings(SIGNUP_PASSWORD="demo-password")
    def test_rejects_a_missing_password(self):
        response = self._register()

        self.assertEqual(response.status_code, 400)
        self.assertIn("signup_password", response.json()["errors"])
        self.assertFalse(self._account_exists())


class TestRegistrationSettingsView(TestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.url = reverse("api:registration-settings")

    @override_settings(SIGNUP_PASSWORD="demo-password")
    def test_reports_a_required_password_to_an_anonymous_user(self):
        response = self.client.get(self.url)

        self.assertEqual(response.json(), {"signup_password_required": True})

    @override_settings(SIGNUP_PASSWORD="")
    def test_reports_no_password_when_none_is_set(self):
        response = self.client.get(self.url)

        self.assertEqual(response.json(), {"signup_password_required": False})
