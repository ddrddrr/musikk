from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIRequestFactory, force_authenticate
from users.models import UserFollow
from users.tests.factories import ArtistFactory, BaseUserFactory

from streaming.api.v1.views.collections import CollectionListCreateView
from streaming.models.collections import CollectionCredit, CollectionType
from streaming.tests.factories import CollectionFactory


class TestCollectionConnectionFilter(TestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.factory = APIRequestFactory()

    def setUp(self):
        self.me = BaseUserFactory()
        self.regular_friend = BaseUserFactory()
        self.artist_friend = ArtistFactory()
        self.followed_artist = ArtistFactory()
        self.stranger = BaseUserFactory()

        UserFollow.objects.create(from_user=self.me, to_user=self.regular_friend)
        UserFollow.objects.create(from_user=self.regular_friend, to_user=self.me)
        UserFollow.objects.create(from_user=self.me, to_user=self.artist_friend)
        UserFollow.objects.create(from_user=self.artist_friend, to_user=self.me)
        UserFollow.objects.create(from_user=self.me, to_user=self.followed_artist)

        self.artist_friend_album = self._authored_collection(
            self.artist_friend, type=CollectionType.ALBUM
        )
        self.followed_artist_album = self._authored_collection(
            self.followed_artist, type=CollectionType.ALBUM
        )
        self.regular_friend_playlist = self._authored_collection(
            self.regular_friend, type=CollectionType.PLAYLIST
        )
        self.stranger_collection = self._authored_collection(
            self.stranger, type=CollectionType.PLAYLIST
        )

        self.regular_friend_followed = self._authored_collection(
            self.stranger, type=CollectionType.PLAYLIST
        )
        self.regular_friend.streamingprofile.liked_collections.add(
            self.regular_friend_followed
        )

        self.artist_friend_draft = self._authored_collection(
            self.artist_friend, type=CollectionType.ALBUM, draft=True
        )
        self.artist_friend_private = self._authored_collection(
            self.artist_friend, type=CollectionType.PLAYLIST, private=True
        )

    def _authored_collection(self, author, **kwargs):
        collection = CollectionFactory(songs__songs_count=0, **kwargs)
        CollectionCredit.objects.create(collection=collection, author=author)
        return collection

    def _list(self, connection: str):
        url = f"{reverse('api:collection-list-create')}?connection={connection}"
        request = self.factory.get(url)
        force_authenticate(request, user=self.me)
        return CollectionListCreateView.as_view()(request)

    def _uuids(self, response) -> set[str]:
        return {item["uuid"] for item in response.data["results"]}

    def test_friends_unions_authored_and_followed_across_roles(self):
        response = self._list("friends")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            self._uuids(response),
            {
                str(self.artist_friend_album.uuid),
                str(self.regular_friend_playlist.uuid),
                str(self.regular_friend_followed.uuid),
            },
        )

    def test_followed_includes_one_way_followed_artist_album(self):
        response = self._list("followed")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            self._uuids(response),
            {
                str(self.artist_friend_album.uuid),
                str(self.regular_friend_playlist.uuid),
                str(self.regular_friend_followed.uuid),
                str(self.followed_artist_album.uuid),
            },
        )
