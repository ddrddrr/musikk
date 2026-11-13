from django.test import TestCase
from streaming.models.collections import CollectionType
from streaming.tests.factories import BaseSongFactory, CollectionFactory
from users.tests.factories import BaseUserFactory
from websockets.topics import TOPIC_VALIDATORS

from social.api.v1.tests.factories import ChatMemberFactory
from social.publication_access_policies import (
    ChatPublicationAccessPolicy,
    CollectionPublicationAccessPolicy,
    FeedPublicationAccessPolicy,
    SongPublicationAccessPolicy,
)
from social.ws import TypingWSActionService


class TestFeedPublicationAccessPolicy(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.owner = BaseUserFactory()
        cls.visitor = BaseUserFactory()
        cls.policy = FeedPublicationAccessPolicy()

    def test_everyone_reads_and_only_the_owner_starts_threads(self):
        self.assertTrue(self.policy.can_read_publications(self.visitor, self.owner))
        self.assertTrue(
            self.policy.can_create_top_level_publication(self.owner, self.owner)
        )
        self.assertFalse(
            self.policy.can_create_top_level_publication(self.visitor, self.owner)
        )


class TestCollectionPublicationAccessPolicy(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.user = BaseUserFactory()
        cls.policy = CollectionPublicationAccessPolicy()
        cls.public_album = CollectionFactory(
            type=CollectionType.ALBUM, songs__songs_count=0
        )
        cls.draft_album = CollectionFactory(
            type=CollectionType.ALBUM, draft=True, songs__songs_count=0
        )
        cls.private_playlist = CollectionFactory(
            type=CollectionType.PLAYLIST, private=True, songs__songs_count=0
        )
        cls.public_history = CollectionFactory(
            type=CollectionType.HISTORY, songs__songs_count=0
        )

    def test_only_public_published_collections_are_readable(self):
        cases = [
            (self.public_album, True),
            (self.draft_album, False),
            (self.private_playlist, False),
        ]
        for collection, expected in cases:
            with self.subTest(collection=collection.title):
                self.assertEqual(
                    self.policy.can_read_publications(self.user, collection), expected
                )

    def test_threads_start_only_on_albums_and_playlists(self):
        self.assertTrue(
            self.policy.can_create_top_level_publication(self.user, self.public_album)
        )
        self.assertFalse(
            self.policy.can_create_top_level_publication(self.user, self.public_history)
        )

    def test_ws_topic_validator_follows_the_policy(self):
        validator = TOPIC_VALIDATORS["collection_comments"]

        self.assertTrue(validator(self.user, str(self.public_album.uuid)))
        self.assertFalse(validator(self.user, str(self.draft_album.uuid)))


class TestChatPublicationAccessPolicy(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.membership = ChatMemberFactory()
        cls.outsider = BaseUserFactory()
        cls.policy = ChatPublicationAccessPolicy()

    def test_only_members_read_and_start_threads(self):
        chat, member = self.membership.chat, self.membership.member

        self.assertTrue(self.policy.can_read_publications(member, chat))
        self.assertTrue(self.policy.can_create_top_level_publication(member, chat))
        self.assertFalse(self.policy.can_read_publications(self.outsider, chat))
        self.assertFalse(
            self.policy.can_create_top_level_publication(self.outsider, chat)
        )

    def test_ws_topic_validator_follows_the_policy(self):
        validator = TOPIC_VALIDATORS["chat"]
        chat_uuid = str(self.membership.chat.uuid)

        self.assertTrue(validator(self.membership.member, chat_uuid))
        self.assertFalse(validator(self.outsider, chat_uuid))


class TestSongPublicationAccessPolicy(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.user = BaseUserFactory()
        cls.policy = SongPublicationAccessPolicy()
        cls.released_song = BaseSongFactory()
        CollectionFactory(type=CollectionType.ALBUM, songs=[cls.released_song])
        cls.unreleased_song = BaseSongFactory()
        CollectionFactory(
            type=CollectionType.ALBUM, draft=True, songs=[cls.unreleased_song]
        )

    def test_only_released_songs_are_readable_and_commentable(self):
        cases = [(self.released_song, True), (self.unreleased_song, False)]
        for song, expected in cases:
            with self.subTest(song=song.title):
                self.assertEqual(
                    self.policy.can_read_publications(self.user, song), expected
                )
                self.assertEqual(
                    self.policy.can_create_top_level_publication(self.user, song),
                    expected,
                )

    def test_ws_topic_validator_follows_the_policy(self):
        validator = TOPIC_VALIDATORS["song_comments"]

        self.assertTrue(validator(self.user, str(self.released_song.uuid)))
        self.assertFalse(validator(self.user, str(self.unreleased_song.uuid)))


class TestTypingEvents(TestCase):
    def test_every_publication_topic_has_a_typing_event(self):
        self.assertEqual(
            TypingWSActionService.PREFIX_TO_EVENT,
            {
                "chat": "chat.typing",
                "collection_comments": "collection_comments.typing",
                "song_comments": "song_comments.typing",
            },
        )
