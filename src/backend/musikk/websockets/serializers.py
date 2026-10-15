from uuid import UUID

from rest_framework import serializers


class TopicSerializer(serializers.Serializer):
    """A topic in the `<prefix>.<uuid>` form.

    Every topic id is the UUID of a model, so a malformed id is rejected here
    instead of failing later in a database lookup. The id is returned as
    `str(UUID)`, the same form that producers use in group names. Otherwise an
    id in upper case would join a group that nobody sends to.
    """

    topic = serializers.CharField()

    def validate_topic(self, value: str) -> tuple[str, str]:
        prefix, _, topic_id = value.partition(".")
        try:
            topic_uuid = UUID(topic_id)
        except ValueError:
            topic_uuid = None
        if not prefix or topic_uuid is None:
            raise serializers.ValidationError(
                "Invalid topic format, expected '<prefix>.<uuid>'"
            )
        return prefix, str(topic_uuid)
