from rest_framework import serializers

from base.serializers import BaseModelSerializer
from streaming.models import PlaybackDevice, PlaybackState


class PlaybackDeviceSerializer(BaseModelSerializer):
    class Meta:
        model = PlaybackDevice
        fields = BaseModelSerializer.Meta.fields + ["is_active", "name"]


class PlaybackStateSerializer(BaseModelSerializer):
    active_device = serializers.SerializerMethodField(allow_null=True)
    devices = serializers.SerializerMethodField()

    class Meta:
        model = PlaybackState
        fields = BaseModelSerializer.Meta.fields + [
            "active_device",
            "devices",
            "is_playing",
        ]

    def get_devices(self, obj):
        return PlaybackDeviceSerializer(obj.playbackdevice_set.all(), many=True).data

    def get_active_device(self, obj):
        return PlaybackDeviceSerializer(obj.active_device()).data
