from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIRequestFactory, force_authenticate
from faker import Faker

from notifications.models import ReplyNotification
from social.api.v1.tests.factories import PublicationFactory
from social.api.v1.views import PublicationListCreateForObjView
from social.models import Publication
from streaming.tests.factories import CollectionFactory
from users.tests.factories import BaseUserFactory

fake = Faker()


# TODO: rewrite based on the new models
class TestPublicationListCreateForObjView(TestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.factory = APIRequestFactory()

    def setUp(self):
        self.user = BaseUserFactory()
        self.collection = CollectionFactory()

    def test_get_publications_list(self):
        publications = PublicationFactory.create_batch(
            3, author=self.user, created_for_object=self.collection
        )

        url = reverse(
            "api:publication-create-list-for-obj",
            kwargs={
                "obj_type": "collection",
                "obj_uuid": str(self.collection.uuid),
            },
        )
        request = self.factory.get(url)
        force_authenticate(request, user=self.user)
        response = PublicationListCreateForObjView.as_view()(
            request,
            obj_type="collection",
            obj_uuid=str(self.collection.uuid),
        )

        self.assertEqual(response.status_code, 200)
        self.assertIsInstance(response.data, list)
        self.assertEqual(len(response.data), 3)

        returned_uuids = {item["uuid"] for item in response.data}
        expected_uuids = {str(p.uuid) for p in publications}
        self.assertSetEqual(returned_uuids, expected_uuids)

        for item in response.data:
            self.assertIn("uuid", item)
            self.assertIn("author", item)
            self.assertIn("content", item)
            self.assertIn("is_deleted", item)
            self.assertIn("obj_type", item)
            self.assertIn("obj_uuid", item)
            self.assertIn("attachment_type", item)
            self.assertIn("attachment_uuid", item)
            self.assertIn("parent_uuid", item)

    def test_create_publication_requires_authentication(self):
        url = reverse(
            "api:publication-create-list-for-obj",
            kwargs={
                "obj_type": "collection",
                "obj_uuid": str(self.collection.uuid),
            },
        )
        payload = {
            "content": fake.paragraph(nb_sentences=2),
            "obj_type": "collection",
            "obj_uuid": str(self.collection.uuid),
        }
        request = self.factory.post(url, payload, format="json")
        response = PublicationListCreateForObjView.as_view()(
            request,
            obj_type="collection",
            obj_uuid=str(self.collection.uuid),
        )

        self.assertEqual(response.status_code, 403)

    def test_create_publication_with_valid_data(self):
        url = reverse(
            "api:publication-create-list-for-obj",
            kwargs={
                "obj_type": "collection",
                "obj_uuid": str(self.collection.uuid),
            },
        )
        payload = {
            "content": fake.paragraph(nb_sentences=2),
            "obj_type": "collection",
            "obj_uuid": str(self.collection.uuid),
        }
        request = self.factory.post(url, payload, format="json")
        force_authenticate(request, user=self.user)
        response = PublicationListCreateForObjView.as_view()(
            request,
            obj_type="collection",
            obj_uuid=str(self.collection.uuid),
        )

        self.assertEqual(response.status_code, 201, repr(response.data))
        self.assertIn("publication", response.data)

        publication_data = response.data["publication"]
        self.assertEqual(publication_data["content"], payload["content"])
        self.assertEqual(publication_data["obj_type"], "collection")
        self.assertEqual(publication_data["obj_uuid"], str(self.collection.uuid))

        publication = Publication.objects.get(uuid=publication_data["uuid"])
        self.assertEqual(publication.content, payload["content"])
        self.assertEqual(publication.author, self.user)
        self.assertEqual(publication.created_for_object, self.collection)

    def test_create_publication_with_parent_creates_notification(self):
        parent_publication = PublicationFactory(
            author=self.user, created_for_object=self.collection
        )

        url = reverse(
            "api:publication-create-list-for-obj",
            kwargs={
                "obj_type": "collection",
                "obj_uuid": str(self.collection.uuid),
            },
        )
        payload = {
            "content": fake.paragraph(nb_sentences=2),
            "obj_type": "collection",
            "obj_uuid": str(self.collection.uuid),
            "parent_uuid": str(parent_publication.uuid),
        }
        request = self.factory.post(url, payload, format="json")
        force_authenticate(request, user=self.user)

        self.assertEqual(ReplyNotification.objects.count(), 0)

        response = PublicationListCreateForObjView.as_view()(
            request,
            obj_type="collection",
            obj_uuid=str(self.collection.uuid),
        )

        self.assertEqual(response.status_code, 201, repr(response.data))

        self.assertEqual(ReplyNotification.objects.count(), 1)
        notification = ReplyNotification.objects.first()
        self.assertEqual(notification.orig_publication, parent_publication)
        self.assertEqual(
            str(notification.reply_publication.uuid),
            response.data["publication"]["uuid"],
        )

    def test_create_publication_missing_obj_type_returns_400(self):
        url = reverse(
            "api:publication-create-list-for-obj",
            kwargs={
                "obj_type": "collection",
                "obj_uuid": str(self.collection.uuid),
            },
        )
        payload = {
            "content": fake.paragraph(nb_sentences=2),
            "obj_uuid": str(self.collection.uuid),
        }
        request = self.factory.post(url, payload, format="json")
        force_authenticate(request, user=self.user)
        response = PublicationListCreateForObjView.as_view()(
            request,
            obj_type="collection",
            obj_uuid=str(self.collection.uuid),
        )

        self.assertEqual(response.status_code, 400)

    def test_create_publication_invalid_obj_type_returns_400(self):
        url = reverse(
            "api:publication-create-list-for-obj",
            kwargs={
                "obj_type": "collection",
                "obj_uuid": str(self.collection.uuid),
            },
        )
        payload = {
            "content": fake.paragraph(nb_sentences=2),
            "obj_type": "invalid_type",
            "obj_uuid": str(self.collection.uuid),
        }
        request = self.factory.post(url, payload, format="json")
        force_authenticate(request, user=self.user)
        response = PublicationListCreateForObjView.as_view()(
            request,
            obj_type="collection",
            obj_uuid=str(self.collection.uuid),
        )

        self.assertEqual(response.status_code, 400)
