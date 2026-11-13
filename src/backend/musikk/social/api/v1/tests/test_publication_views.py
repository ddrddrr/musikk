from unittest.mock import patch
from uuid import UUID, uuid4

from django.test import TestCase
from django.urls import reverse
from faker import Faker
from notifications.models import ReplyNotification
from rest_framework.test import APIRequestFactory, force_authenticate
from streaming.models.collections import CollectionType
from streaming.tests.factories import (
    BaseSongFactory,
    CollectionFactory,
    CollectionSongFactory,
)
from users.tests.factories import BaseUserFactory
from websockets.topics import topic_group

from social.api.v1.tests.factories import ChatMemberFactory, PublicationFactory
from social.api.v1.views import (
    ChatAttachmentsListView,
    CollectionCommentsListCreateView,
    FeedPostsListCreateView,
    PublicationChildrenView,
    SongCommentsListCreateView,
)
from social.models import Publication
from social.ws import ServerEvent

fake = Faker()


class TestCollectionCommentsListCreateView(TestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.factory = APIRequestFactory()

    def setUp(self):
        self.user = BaseUserFactory()
        self.other_user = BaseUserFactory()
        self.collection = CollectionFactory(private=False)
        self.other_collection = CollectionFactory(private=False)

    def _post(self, payload, user=None):
        url = reverse(
            "api:collection-comments-list-retrieve",
            kwargs={"collection_uuid": self.collection.uuid},
        )
        request = self.factory.post(url, payload, format="json")
        if user is not None:
            force_authenticate(request, user=user)
        return CollectionCommentsListCreateView.as_view()(
            request, collection_uuid=self.collection.uuid
        )

    def _get(self, user=None):
        url = reverse(
            "api:collection-comments-list-retrieve",
            kwargs={"collection_uuid": self.collection.uuid},
        )
        request = self.factory.get(url)
        if user is not None:
            force_authenticate(request, user=user)
        return CollectionCommentsListCreateView.as_view()(
            request, collection_uuid=self.collection.uuid
        )

    def test_get_publications_list(self):
        publications = PublicationFactory.create_batch(
            3, author=self.user, created_for_object=self.collection
        )

        response = self._get(user=self.user)

        self.assertEqual(response.status_code, 200)
        results = response.data["results"]
        self.assertEqual(len(results), 3)

        returned_uuids = {item["uuid"] for item in results}
        expected_uuids = {str(p.uuid) for p in publications}
        self.assertSetEqual(returned_uuids, expected_uuids)

        for item in results:
            self.assertIn("uuid", item)
            self.assertIn("author", item)
            self.assertIn("content", item)
            self.assertIn("is_deleted", item)
            self.assertIn("attachment", item)
            self.assertIn("parent_uuid", item)

    def test_create_publication_requires_authentication(self):
        payload = {"content": fake.paragraph(nb_sentences=2)}
        response = self._post(payload, user=None)
        self.assertEqual(response.status_code, 401)

    def test_root_publication_creation(self):
        payload = {"content": fake.paragraph(nb_sentences=2)}

        response = self._post(payload, user=self.user)

        self.assertEqual(response.status_code, 201, repr(response.data))
        self.assertEqual(response.data["content"], payload["content"])
        self.assertIsNone(response.data["parent_uuid"])

        db_pub = Publication.objects.get(uuid=response.data["uuid"])
        self.assertEqual(db_pub.author, self.user)
        self.assertEqual(db_pub.created_for_object.uuid, self.collection.uuid)

    def test_publication_creation_with_attachment_for_all_attachment_types(self):
        attachment_cases = [
            ("collection", self.other_collection),
            ("user", self.other_user),
            ("song", CollectionSongFactory()),
        ]

        for attachment_type, attachment_obj in attachment_cases:
            payload = {
                "content": fake.paragraph(nb_sentences=2),
                "attachment": {
                    "type": attachment_type,
                    "uuid": str(attachment_obj.uuid),
                },
            }

            response = self._post(payload, user=self.user)
            self.assertEqual(response.status_code, 201, repr(response.data))

            db_pub = Publication.objects.get(uuid=response.data["uuid"])
            self.assertIsNotNone(db_pub.attachment_object)
            self.assertEqual(db_pub.attachment_object.uuid, attachment_obj.uuid)

    def test_created_for_inherited_from_root_when_reply_omits_created_for(self):
        parent = PublicationFactory(
            author=self.user, created_for_object=self.collection
        )

        payload = {
            "content": fake.paragraph(nb_sentences=2),
            "parent_uuid": str(parent.uuid),
        }

        self.assertEqual(ReplyNotification.objects.count(), 0)

        response = self._post(payload, user=self.user)
        self.assertEqual(response.status_code, 201, repr(response.data))
        self.assertEqual(response.data["parent_uuid"], str(parent.uuid))

        db_pub = Publication.objects.get(uuid=response.data["uuid"])
        self.assertEqual(db_pub.parent.uuid, parent.uuid)
        self.assertEqual(db_pub.created_for_object.uuid, self.collection.uuid)

        self.assertEqual(ReplyNotification.objects.count(), 1)
        n = ReplyNotification.objects.first()
        self.assertEqual(n.orig_publication, parent)
        self.assertEqual(n.reply_publication.uuid, db_pub.uuid)

    def test_failure_when_attachment_type_is_wrong(self):
        payload = {
            "content": fake.paragraph(nb_sentences=2),
            "attachment": {"type": "nope", "uuid": str(self.collection.uuid)},
        }
        response = self._post(payload, user=self.user)
        self.assertEqual(response.status_code, 400)

    def test_attachment_must_be_public_and_published(self):
        hidden_cases = [
            ("collection", CollectionFactory(private=True)),
            ("collection", CollectionFactory(type="album", draft=True)),
            ("song", CollectionSongFactory(collection=CollectionFactory(private=True))),
        ]

        for attachment_type, attachment_obj in hidden_cases:
            with self.subTest(attachment_type=attachment_type):
                payload = {
                    "content": fake.paragraph(nb_sentences=2),
                    "attachment": {
                        "type": attachment_type,
                        "uuid": str(attachment_obj.uuid),
                    },
                }

                response = self._post(payload, user=self.user)

                self.assertEqual(response.status_code, 400)

    def test_unknown_collection_returns_404(self):
        request = self.factory.get("/")
        force_authenticate(request, user=self.user)

        response = CollectionCommentsListCreateView.as_view()(
            request, collection_uuid=uuid4()
        )

        self.assertEqual(response.status_code, 404)

    def test_reply_under_comment_on_draft_collection_forbidden(self):
        parent = PublicationFactory(
            author=self.other_user, created_for_object=self.collection
        )
        self.collection.draft = True
        self.collection.save(update_fields=["draft"])

        payload = {
            "content": fake.paragraph(nb_sentences=2),
            "parent_uuid": str(parent.uuid),
        }
        response = self._post(payload, user=self.user)

        self.assertEqual(response.status_code, 403)


class TestSongCommentsListCreateView(TestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.factory = APIRequestFactory()

    def setUp(self):
        self.user = BaseUserFactory()
        self.other_user = BaseUserFactory()
        self.released_song = BaseSongFactory()
        CollectionFactory(type=CollectionType.ALBUM, songs=[self.released_song])
        self.unreleased_song = BaseSongFactory()
        CollectionFactory(
            type=CollectionType.ALBUM, draft=True, songs=[self.unreleased_song]
        )

    def _url(self, song) -> str:
        return reverse("api:song-comments-list-create", kwargs={"song_uuid": song.uuid})

    def _post(self, song, user, payload):
        request = self.factory.post(self._url(song), payload, format="json")
        force_authenticate(request, user=user)
        return SongCommentsListCreateView.as_view()(request, song_uuid=song.uuid)

    def _get(self, song, user):
        request = self.factory.get(self._url(song))
        force_authenticate(request, user=user)
        return SongCommentsListCreateView.as_view()(request, song_uuid=song.uuid)

    def test_comment_and_reply_on_released_song(self):
        comment = self._post(
            self.released_song, self.user, {"content": fake.sentence()}
        )
        reply = self._post(
            self.released_song,
            self.other_user,
            {"content": fake.sentence(), "parent_uuid": comment.data["uuid"]},
        )
        listing = self._get(self.released_song, self.user)

        self.assertEqual(comment.status_code, 201, repr(comment.data))
        self.assertEqual(reply.status_code, 201, repr(reply.data))
        self.assertEqual(listing.status_code, 200)
        self.assertCountEqual(
            [item["uuid"] for item in listing.data["results"]],
            [comment.data["uuid"], reply.data["uuid"]],
        )
        self.assertEqual(
            comment.data["created_for"],
            {"type": "song", "uuid": str(self.released_song.uuid)},
        )
        self.assertEqual(
            ReplyNotification.objects.get().reply_publication.uuid,
            UUID(reply.data["uuid"]),
        )

    @patch("social.api.v1.views.send_ws_event")
    def test_new_comment_is_announced_on_the_song_topic(self, send_ws_event_mock):
        self._post(self.released_song, self.user, {"content": fake.sentence()})

        song_uuid = str(self.released_song.uuid)
        send_ws_event_mock.assert_called_once_with(
            topic_group("song_comments", song_uuid),
            ServerEvent.SONG_COMMENTS_CHANGED,
            song_uuid=song_uuid,
        )

    def test_unreleased_song_has_no_comments(self):
        listing = self._get(self.unreleased_song, self.user)
        comment = self._post(
            self.unreleased_song, self.user, {"content": fake.sentence()}
        )

        self.assertEqual(listing.status_code, 403)
        self.assertEqual(comment.status_code, 403)


class TestFeedPostsListCreateView(TestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.factory = APIRequestFactory()

    def setUp(self):
        self.user = BaseUserFactory()
        self.other_user = BaseUserFactory()

    def _url(self, target_user):
        return reverse("api:feed-list-retrieve", kwargs={"user_uuid": target_user.uuid})

    def _post(self, target_user, payload, user=None):
        request = self.factory.post(self._url(target_user), payload, format="json")
        if user is not None:
            force_authenticate(request, user=user)
        return FeedPostsListCreateView.as_view()(request, user_uuid=target_user.uuid)

    def _get(self, target_user, user=None):
        request = self.factory.get(self._url(target_user))
        if user is not None:
            force_authenticate(request, user=user)
        return FeedPostsListCreateView.as_view()(request, user_uuid=target_user.uuid)

    def test_get_feed_publications_list(self):
        publications = PublicationFactory.create_batch(
            3, author=self.user, created_for_object=self.user
        )

        response = self._get(self.user, user=self.user)

        self.assertEqual(response.status_code, 200)
        results = response.data["results"]
        self.assertEqual(len(results), 3)

        returned_uuids = {item["uuid"] for item in results}
        expected_uuids = {str(p.uuid) for p in publications}
        self.assertSetEqual(returned_uuids, expected_uuids)

    def test_root_publication_creation_on_own_feed(self):
        payload = {"content": fake.paragraph(nb_sentences=2)}

        response = self._post(self.user, payload, user=self.user)

        self.assertEqual(response.status_code, 201, repr(response.data))
        self.assertEqual(response.data["content"], payload["content"])
        self.assertIsNone(response.data["parent_uuid"])

        db_pub = Publication.objects.get(uuid=response.data["uuid"])
        self.assertEqual(db_pub.author, self.user)
        self.assertEqual(db_pub.created_for_object.uuid, self.user.uuid)

    def test_root_publication_on_someone_elses_feed_forbidden(self):
        payload = {"content": fake.paragraph(nb_sentences=2)}

        response = self._post(self.other_user, payload, user=self.user)

        self.assertEqual(response.status_code, 403)

    def test_unknown_user_feed_returns_404(self):
        request = self.factory.get("/")
        force_authenticate(request, user=self.user)

        response = FeedPostsListCreateView.as_view()(request, user_uuid=uuid4())

        self.assertEqual(response.status_code, 404)


class TestPublicationChildrenView(TestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.factory = APIRequestFactory()

    def setUp(self):
        self.membership = ChatMemberFactory()
        self.outsider = BaseUserFactory()
        self.message = PublicationFactory(
            author=self.membership.member, created_for_object=self.membership.chat
        )
        self.reply = PublicationFactory(
            author=self.membership.member, parent=self.message
        )

    def _get(self, user):
        url = reverse("api:publication-children", kwargs={"uuid": self.message.uuid})
        request = self.factory.get(url)
        force_authenticate(request, user=user)
        return PublicationChildrenView.as_view()(request, uuid=self.message.uuid)

    def test_chat_member_reads_replies(self):
        response = self._get(self.membership.member)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            [child["uuid"] for child in response.data["children"]],
            [str(self.reply.uuid)],
        )

    def test_outsider_cannot_read_replies_in_a_chat(self):
        response = self._get(self.outsider)

        self.assertEqual(response.status_code, 403)


class TestChatAttachmentsListView(TestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.factory = APIRequestFactory()

    def setUp(self):
        self.user = BaseUserFactory()

    def test_unknown_chat_returns_404(self):
        request = self.factory.get("/")
        force_authenticate(request, user=self.user)

        response = ChatAttachmentsListView.as_view()(
            request, user_uuid=self.user.uuid, chat_uuid=uuid4()
        )

        self.assertEqual(response.status_code, 404)
