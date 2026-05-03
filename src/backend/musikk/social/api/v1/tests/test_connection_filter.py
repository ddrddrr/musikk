from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIRequestFactory, force_authenticate
from users.models import UserFollow
from users.tests.factories import BaseUserFactory

from social.api.v1.tests.factories import PublicationFactory
from social.api.v1.views import FeedPostsListCreateView


class TestPublicationConnectionFilter(TestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.factory = APIRequestFactory()

    def setUp(self):
        self.me = BaseUserFactory()
        self.friend = BaseUserFactory()
        self.one_way_followed = BaseUserFactory()
        self.stranger = BaseUserFactory()

        UserFollow.objects.create(from_user=self.me, to_user=self.friend)
        UserFollow.objects.create(from_user=self.friend, to_user=self.me)
        UserFollow.objects.create(from_user=self.me, to_user=self.one_way_followed)

        self.friend_post = PublicationFactory(
            author=self.friend, created_for_object=self.friend
        )
        self.followed_post = PublicationFactory(
            author=self.one_way_followed, created_for_object=self.one_way_followed
        )
        self.stranger_post = PublicationFactory(
            author=self.stranger, created_for_object=self.stranger
        )

    def _list(self, connection: str | None):
        url = reverse("api:global-feed-list")
        if connection is not None:
            url = f"{url}?connection={connection}"
        request = self.factory.get(url)
        force_authenticate(request, user=self.me)
        return FeedPostsListCreateView.as_view()(request)

    def _uuids(self, response) -> set[str]:
        return {item["uuid"] for item in response.data["results"]}

    def test_connection_friends_returns_only_mutual_authors(self):
        response = self._list("friends")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(self._uuids(response), {str(self.friend_post.uuid)})

    def test_connection_followed_includes_friends_and_one_way_follows(self):
        response = self._list("followed")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            self._uuids(response),
            {str(self.friend_post.uuid), str(self.followed_post.uuid)},
        )

    def test_no_connection_filter_returns_all_top_level_posts(self):
        response = self._list(None)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            self._uuids(response),
            {
                str(self.friend_post.uuid),
                str(self.followed_post.uuid),
                str(self.stranger_post.uuid),
            },
        )
