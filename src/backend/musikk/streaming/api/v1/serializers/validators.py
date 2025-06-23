import uuid

from rest_framework import serializers

from users.models import BaseUser


def validate_authors(authors: list[str | uuid.UUID]) -> list[BaseUser]:
    qs_authors = BaseUser.objects.filter(uuid__in=authors)
    found_uuids = {str(a.uuid) for a in qs_authors}
    missing = [str(u) for u in authors if str(u) not in found_uuids]
    if missing:
        raise serializers.ValidationError(
            {"authors": f"Authors were not found: {', '.join(missing)}"}
        )

    return qs_authors