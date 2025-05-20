import json

from django.db import transaction
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from rest_framework.generics import (
    get_object_or_404,
)
from rest_framework_simplejwt.tokens import RefreshToken

from sse.config import EventChannels
from sse.events import send_invalidate_event
from streaming.api.v1.serializers import (
    PlaybackStateSerializer,
    PlaybackDeviceSerializer,
)
from streaming.models import PlaybackState, PlaybackDevice
from users.users_extended import StreamingUser


class PlaybackDeviceView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        user = request.user.streaminguser
        with transaction.atomic():
            pd = PlaybackDevice.objects.create(
                playback_state=user.playback_state, name=request.data["name"]
            )
            if not user.playback_state.active_device():
                pd.is_active = True
                pd.save()
                user.playback_state.is_active = False
                user.playback_state.save()
                send_invalidate_event(EventChannels.user_events(user.uuid), ["playback"])

        return Response(
            status=status.HTTP_201_CREATED, data=PlaybackDeviceSerializer(pd).data
        )


class PlaybackDeviceActivateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        user = request.user.streaminguser
        device_uuid = kwargs["uuid"]
        with transaction.atomic():
            playback_state = user.playback_state

            pd = get_object_or_404(
                PlaybackDevice, uuid=device_uuid, playback_state=playback_state
            )
            active_device = playback_state.active_device()
            if active_device and active_device.uuid != device_uuid:
                active_device.is_active = False
                active_device.save()
            pd.is_active = True
            pd.save()
            playback_state.is_playing = False
            playback_state.save()

        send_invalidate_event(EventChannels.user_events(user.uuid), ["playback"])
        return Response(status=status.HTTP_204_NO_CONTENT)


# TODO: also add last access and custom task to delete every once in a while
@method_decorator(
    csrf_exempt, name="dispatch"
)  # beacon requests don't have CSRF tokens
class PlaybackDeviceDeleteView(APIView):
    def post(self, request, *args, **kwargs):
        data = json.loads(request.body)
        token = data.get("token")
        device_uuid = data.get("uuid")
        if not token or not device_uuid:
            return Response({"error": "Missing token or device_id"}, status=400)

        try:
            token = RefreshToken(token)
            user_uuid = token["uuid"]
        except Exception:
            return Response({"error": "Invalid token"}, status=401)

        with transaction.atomic():
            user = get_object_or_404(StreamingUser, uuid=user_uuid)
            pd = get_object_or_404(
                PlaybackDevice, playback_state=user.playback_state, uuid=device_uuid
            )
            was_active = pd.is_active
            pd.delete()
            if was_active:
                devices = user.playback_state.playbackdevice_set.all()
                if devices:
                    devices[0].is_active = True
                    devices[0].save()
                user.playback_state.is_playing = False
                user.playback_state.save()

        send_invalidate_event(EventChannels.user_events(user.uuid), ["playback"])
        return Response(status=status.HTTP_204_NO_CONTENT)


class PlaybackStateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        playback_state = request.user.streaminguser.playback_state
        playback_state = PlaybackStateSerializer(playback_state).data
        return Response(status=status.HTTP_200_OK, data=playback_state)

    def post(self, request, *args, **kwargs):
        user = request.user.streaminguser
        is_playing = request.data["is_playing"]

        with transaction.atomic():
            playback_state = user.playback_state
            playback_state.is_playing = is_playing
            playback_state.save()
        send_invalidate_event(EventChannels.user_events(user.uuid), ["playback"])
        return Response(status=status.HTTP_204_NO_CONTENT)
