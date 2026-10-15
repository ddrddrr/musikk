from django.test import SimpleTestCase

from websockets.serializers import TopicSerializer

TOPIC_ID = "3f2b8c1e-9a4d-4e6f-8b7a-1c2d3e4f5a6b"


class TestTopicSerializer(SimpleTestCase):
    def test_splits_topic_into_prefix_and_id(self):
        serializer = TopicSerializer(data={"topic": f"chat.{TOPIC_ID}"})

        self.assertTrue(serializer.is_valid(), serializer.errors)
        self.assertEqual(serializer.validated_data, {"topic": ("chat", TOPIC_ID)})

    def test_returns_id_in_standard_form(self):
        serializer = TopicSerializer(data={"topic": f"chat.{TOPIC_ID.upper()}"})

        self.assertTrue(serializer.is_valid(), serializer.errors)
        self.assertEqual(serializer.validated_data, {"topic": ("chat", TOPIC_ID)})

    def test_rejects_invalid_topics(self):
        for payload in [
            {},
            {"topic": ""},
            {"topic": "invalid"},
            {"topic": "chat."},
            {"topic": "chat.abc-123"},
            {"topic": f".{TOPIC_ID}"},
            {"topic": f"chat.{TOPIC_ID}.extra"},
        ]:
            with self.subTest(payload=payload):
                self.assertFalse(TopicSerializer(data=payload).is_valid())
