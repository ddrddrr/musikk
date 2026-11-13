from django.contrib.auth.models import AnonymousUser
from django.test import TestCase
from users.tests.factories import BaseUserFactory

from streaming.models import BaseSong, Collection
from streaming.models.collections import CollectionCredit, CollectionType
from streaming.models.songs import CollectionSong
from streaming.tests.factories import BaseSongFactory, CollectionFactory


class TestCollectionPublicOrAuthoredBy(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.author = BaseUserFactory()
        cls.other_user = BaseUserFactory()
        cls.public_collection = CollectionFactory(private=False, songs__songs_count=0)
        cls.private_collection = CollectionFactory(private=True, songs__songs_count=0)
        CollectionCredit.objects.create(
            collection=cls.public_collection, author=cls.author
        )
        CollectionCredit.objects.create(
            collection=cls.public_collection, author=cls.other_user
        )
        CollectionCredit.objects.create(
            collection=cls.private_collection, author=cls.author
        )

    def _visible_test_collections(self, user) -> list[Collection]:
        return list(
            Collection.objects.public_or_authored_by(user).filter(
                pk__in=[self.public_collection.pk, self.private_collection.pk]
            )
        )

    def test_author_sees_public_and_own_private_collections_once(self):
        self.assertCountEqual(
            self._visible_test_collections(self.author),
            [self.public_collection, self.private_collection],
        )

    def test_other_user_sees_only_public_collection(self):
        self.assertCountEqual(
            self._visible_test_collections(self.other_user), [self.public_collection]
        )

    def test_anonymous_user_sees_only_public_collection(self):
        self.assertCountEqual(
            self._visible_test_collections(AnonymousUser()), [self.public_collection]
        )


class TestBaseSongInPublicPublishedAlbum(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.released_song = BaseSongFactory()
        cls.draft_album_song = BaseSongFactory()
        cls.private_album_song = BaseSongFactory()
        cls.playlist_only_song = BaseSongFactory()
        cls.songs = [
            cls.released_song,
            cls.draft_album_song,
            cls.private_album_song,
            cls.playlist_only_song,
        ]

        CollectionFactory(type=CollectionType.ALBUM, songs=[cls.released_song])
        CollectionFactory(type=CollectionType.ALBUM, songs=[cls.released_song])
        CollectionFactory(
            type=CollectionType.ALBUM, draft=True, songs=[cls.draft_album_song]
        )
        CollectionFactory(
            type=CollectionType.ALBUM, private=True, songs=[cls.private_album_song]
        )
        CollectionFactory(
            type=CollectionType.PLAYLIST,
            songs=[cls.playlist_only_song, cls.released_song],
        )

    def test_returns_only_songs_on_a_public_published_album_once(self):
        result = list(
            BaseSong.objects.in_public_published_album().filter(
                pk__in=[song.pk for song in self.songs]
            )
        )

        self.assertEqual(result, [self.released_song])
        self.assertEqual(
            CollectionSong.objects.filter(song=self.released_song).count(), 3
        )
