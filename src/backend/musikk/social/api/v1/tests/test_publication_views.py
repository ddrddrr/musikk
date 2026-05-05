from django.test import TestCase
from django.urls import reverse
from faker import Faker
from notifications.models import ReplyNotification
from rest_framework.test import APIRequestFactory, force_authenticate
from streaming.tests.factories import CollectionFactory, CollectionSongFactory
from users.tests.factories import BaseUserFactory

from social.api.v1.tests.factories import PublicationFactory
from social.api.v1.views import (
    CollectionCommentsListCreateView,
    FeedPostsListCreateView,
)
from social.models import Publication

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
        self.assertEqual(response.status_code, 403)

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
