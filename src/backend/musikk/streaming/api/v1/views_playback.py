from django.db import transaction
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.generics import (
    get_object_or_404,
    RetrieveAPIView,
)

from sse.config import EventChannels
from sse.events import send_invalidate_event
from streaming.api.v1.serializers import (
    PlaybackStateSerializer,
    PlaybackDeviceSerializer,
)
from streaming.models import PlaybackState, PlaybackDevice
from streaming.song_collections import SongCollection
from streaming.songs import BaseSong


class RegisterPlaybackDevice(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        user = request.user.streaminguser
        pd = PlaybackDevice.objects.create(playback_state=user.playback_state)
        return Response(
            status=status.HTTP_201_CREATED, data=PlaybackDeviceSerializer(pd).data
        )


class PlaybackRetrieveView(RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = PlaybackStateSerializer
    queryset = PlaybackState.objects.all()

    def get_object(self):
        return self.request.user.streaminguser.playback_state


class PlaybackActivateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        user = request.user.streaminguser
        playback_state = user.playback_state
        with transaction.atomic():
            active_device_uuid = request.data["active_device_uuid"]
            if not active_device_uuid:
                return Response(
                    status=status.HTTP_400_BAD_REQUEST,
                    data={"error": "active_device_uuid is required"},
                )

            active_device_instance = playback_state.active_device()
            if (
                active_device_instance is not None
                and active_device_instance.uuid != active_device_uuid
            ):
                # TODO: send event...?
                active_device_instance.is_active = False
                active_device_instance.save()

                active_device_instance = get_object_or_404(
                    PlaybackDevice,
                    uuid=active_device_uuid,
                    playback_state=playback_state,
                )
                active_device_instance.is_active = True
                active_device_instance.save()

            playback_state.is_playing = True
            playback_state.save()
        send_invalidate_event(EventChannels.user_events(user.uuid), ["playback"])
        return Response(status=status.HTTP_204_NO_CONTENT)


class PlaybackStopView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        user = request.user.streaminguser
        playback_state = user.playback_state
        with transaction.atomic():
            playback_state.is_playing = False
            playback_state.save()
        send_invalidate_event(EventChannels.user_events(user.uuid), ["playback"])
        return Response(status=status.HTTP_204_NO_CONTENT)
