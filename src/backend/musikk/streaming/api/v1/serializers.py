from rest_framework import serializers

from streaming.api.v1.serializers_song import *
from streaming.api.v1.serializers_song_queue import *
from streaming.api.v1.serializers_song_collection import *
from base.serializers import BaseModelSerializer
from streaming.models import PlaybackState, PlaybackDevice


class PlaybackDeviceSerializer(BaseModelSerializer):
    class Meta:
        model = PlaybackDevice
        fields = BaseModelSerializer.Meta.fields + ["is_active", "name"]


class PlaybackStateSerializer(BaseModelSerializer):
    active_device = serializers.SerializerMethodField()
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
