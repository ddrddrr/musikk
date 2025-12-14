import uuid

from rest_framework import serializers

from users.models import BaseUser, UserRole


def validate_authors(author_uuids: list[str | uuid.UUID]) -> list[BaseUser]:
    authors = list(BaseUser.objects.filter(uuid__in=author_uuids, role=UserRole.ARTIST))
    found_uuids = {str(a.uuid) for a in authors}
    missing = [str(u) for u in author_uuids if str(u) not in found_uuids]
    if missing:
        raise serializers.ValidationError(
            {"authors": f"Authors were not found: {', '.join(missing)}"}
        )
    return authors
