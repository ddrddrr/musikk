import uuid

from rest_framework import serializers

from users.models import BaseUser


def validate_participants_are_friends(
    user: BaseUser, participant_uuids: list[str | uuid.UUID]
) -> list[BaseUser]:
    filtered_friends = list(user.friends.filter(uuid__in=participant_uuids))
    if len(filtered_friends) != len(participant_uuids):
        found_uuids = {str(f.uuid) for f in filtered_friends}
        missing = [str(u) for u in participant_uuids if str(u) not in found_uuids]
        raise serializers.ValidationError(
            {"participants": f"Some participants are not in the user's friend list: {', '.join(missing)}"}
        )
    return filtered_friends
