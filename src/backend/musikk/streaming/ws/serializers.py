from rest_framework import serializers

from streaming.audio.config import MAX_DURATION_SECONDS


class DeviceRegisterSerializer(serializers.Serializer):
    device_id = serializers.CharField()
    name = serializers.CharField()
    volume = serializers.IntegerField(required=False, min_value=0, max_value=100)


class DeviceSetActiveSerializer(serializers.Serializer):
    device_id = serializers.CharField()


class DeviceSetVolumeSerializer(serializers.Serializer):
    device_id = serializers.CharField()
    volume = serializers.IntegerField(min_value=0, max_value=100)


class PlaybackSetSerializer(serializers.Serializer):
    """A play/pause, a seek, or both.

    A seek carries the play item it was made in, so the server can drop a seek
    from a tab that has not seen the latest track change yet.
    """

    is_playing = serializers.BooleanField(required=False)
    # no real position is past the end of the longest song that can be uploaded
    song_pos_ms = serializers.IntegerField(
        required=False, min_value=0, max_value=MAX_DURATION_SECONDS * 1000
    )
    curr_play_item_unique_id = serializers.CharField(required=False)

    def validate(self, attrs: dict) -> dict:
        is_seek = "song_pos_ms" in attrs
        if is_seek != ("curr_play_item_unique_id" in attrs):
            raise serializers.ValidationError(
                "`song_pos_ms` and `curr_play_item_unique_id` must be sent together"
            )
        if not is_seek and "is_playing" not in attrs:
            raise serializers.ValidationError("Expected `is_playing`, a seek, or both")
        return attrs


class ActiveDeviceReportSerializer(serializers.Serializer):
    curr_play_item_unique_id = serializers.CharField()
    is_playing = serializers.BooleanField()
    song_pos_ms = serializers.IntegerField(
        min_value=0, max_value=MAX_DURATION_SECONDS * 1000
    )
