from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIRequestFactory, force_authenticate
from faker import Faker

from notifications.models import ReplyNotification
from social.api.v1.tests.factories import PublicationFactory
from social.api.v1.views import PublicationListCreateForObjView
from social.models import Publication
from streaming.tests.factories import CollectionFactory, CollectionSongFactory
from users.tests.factories import BaseUserFactory

fake = Faker()


class TestPublicationListCreateForObjView(TestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.factory = APIRequestFactory()

    def setUp(self):
        self.user = BaseUserFactory()
        self.other_user = BaseUserFactory()
        self.collection = CollectionFactory()
        self.other_collection = CollectionFactory()

    def _post(self, obj_type: str, obj_uuid: str, payload: dict, user=None):
        url = reverse(
            "api:publication-create-list-for-obj",
            kwargs={"obj_type": obj_type, "obj_uuid": obj_uuid},
        )
        request = self.factory.post(url, payload, format="json")
        if user is not None:
            force_authenticate(request, user=user)
        return PublicationListCreateForObjView.as_view()(
            request, obj_type=obj_type, obj_uuid=obj_uuid
        )

    def _get(
        self, obj_type: str, obj_uuid: str, user=None, with_children: bool = False
    ):
        url = reverse(
            "api:publication-create-list-for-obj",
            kwargs={"obj_type": obj_type, "obj_uuid": obj_uuid},
        )
        if with_children:
            url = f"{url}?with_children=1"
        request = self.factory.get(url)
        if user is not None:
            force_authenticate(request, user=user)
        return PublicationListCreateForObjView.as_view()(
            request, obj_type=obj_type, obj_uuid=obj_uuid
        )

    def test_get_publications_list(self):
        publications = PublicationFactory.create_batch(
            3, author=self.user, created_for_object=self.collection
        )

        response = self._get("collection", str(self.collection.uuid), user=self.user)

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
            self.assertIn("created_for", item)
            self.assertIn("attachment", item)
            self.assertIn("parent_uuid", item)

    def test_create_publication_requires_authentication(self):
        payload = {
            "content": fake.paragraph(nb_sentences=2),
            "created_for": {"type": "collection", "uuid": str(self.collection.uuid)},
        }
        response = self._post(
            "collection", str(self.collection.uuid), payload, user=None
        )
        self.assertEqual(response.status_code, 403)

    def test_root_publication_creation_for_all_created_for_types(self):
        cases = [
            ("collection", self.collection),
            ("feed", self.user),
        ]

        for type_key, target_obj in cases:
            payload = {
                "content": fake.paragraph(nb_sentences=2),
                "created_for": {"type": type_key, "uuid": str(target_obj.uuid)},
            }
            response = self._post(
                type_key, str(target_obj.uuid), payload, user=self.user
            )

            self.assertEqual(response.status_code, 201, repr(response.data))
            pub = response.data["publication"]

            self.assertEqual(pub["content"], payload["content"])
            self.assertEqual(pub["created_for"]["type"], type_key)
            self.assertEqual(pub["created_for"]["uuid"], str(target_obj.uuid))
            self.assertIsNone(pub["parent_uuid"])

            db_pub = Publication.objects.get(uuid=pub["uuid"])
            self.assertEqual(db_pub.author, self.user)
            self.assertEqual(db_pub.created_for_object.uuid, target_obj.uuid)

    def test_publication_creation_with_attachment_for_all_attachment_types(self):
        attachment_cases = [
            ("collection", self.other_collection),
            ("user", self.other_user),
            ("song", CollectionSongFactory()),
        ]

        for attachment_type, attachment_obj in attachment_cases:
            payload = {
                "content": fake.paragraph(nb_sentences=2),
                "created_for": {
                    "type": "collection",
                    "uuid": str(self.collection.uuid),
                },
                "attachment": {
                    "type": attachment_type,
                    "uuid": str(attachment_obj.uuid),
                },
            }

            response = self._post(
                "collection", str(self.collection.uuid), payload, user=self.user
            )
            self.assertEqual(response.status_code, 201, repr(response.data))

            pub = response.data["publication"]
            self.assertEqual(pub["attachment"]["type"], attachment_type)
            self.assertEqual(pub["attachment"]["uuid"], str(attachment_obj.uuid))

            db_pub = Publication.objects.get(uuid=pub["uuid"])
            self.assertIsNotNone(db_pub.attachment_object)
            self.assertEqual(db_pub.attachment_object.uuid, attachment_obj.uuid)

    def test_created_for_inherited_from_root_when_reply_omits_created_for(self):
        parent = PublicationFactory(
            author=self.user, created_for_object=self.collection
        )

        payload = {
            "content": fake.paragraph(nb_sentences=2),
            "parent_uuid": str(parent.uuid),
            # created_for omitted intentionally
        }

        self.assertEqual(ReplyNotification.objects.count(), 0)

        response = self._post(
            "collection", str(self.collection.uuid), payload, user=self.user
        )
        self.assertEqual(response.status_code, 201, repr(response.data))

        pub = response.data["publication"]
        self.assertEqual(pub["created_for"]["type"], "collection")
        self.assertEqual(pub["created_for"]["uuid"], str(self.collection.uuid))
        self.assertEqual(pub["parent_uuid"], str(parent.uuid))

        db_pub = Publication.objects.get(uuid=pub["uuid"])
        self.assertEqual(db_pub.parent.uuid, parent.uuid)
        self.assertEqual(db_pub.created_for_object.uuid, self.collection.uuid)

        self.assertEqual(ReplyNotification.objects.count(), 1)
        n = ReplyNotification.objects.first()
        self.assertEqual(n.orig_publication, parent)
        self.assertEqual(n.reply_publication.uuid, db_pub.uuid)

    def test_failure_when_created_for_type_is_wrong(self):
        payload = {
            "content": fake.paragraph(nb_sentences=2),
            "created_for": {"type": "nope", "uuid": str(self.collection.uuid)},
        }
        response = self._post(
            "collection", str(self.collection.uuid), payload, user=self.user
        )
        self.assertEqual(response.status_code, 400)

    def test_failure_when_attachment_type_is_wrong(self):
        payload = {
            "content": fake.paragraph(nb_sentences=2),
            "created_for": {"type": "collection", "uuid": str(self.collection.uuid)},
            "attachment": {"type": "nope", "uuid": str(self.collection.uuid)},
        }
        response = self._post(
            "collection", str(self.collection.uuid), payload, user=self.user
        )
        self.assertEqual(response.status_code, 400)

    def test_failure_when_top_level_publication_omits_created_for(self):
        payload = {
            "content": fake.paragraph(nb_sentences=2),
            # created_for omitted and no parent
        }
        response = self._post(
            "collection", str(self.collection.uuid), payload, user=self.user
        )
        self.assertEqual(response.status_code, 400)
