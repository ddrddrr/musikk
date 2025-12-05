from django.db import transaction
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.generics import (
    get_object_or_404,
)

from streaming.models.state import StreamingProfile
from websockets.event_helpers import send_ws_event
from streaming.api.v1.serializers.playback import (
    PlaybackDeviceSerializer,
    PlaybackStateSerializer,
)
from streaming.models import PlaybackDevice


class PlaybackDeviceView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        pd_name = request.data.get("name")
        if not pd_name:
            return Response(
                status=status.HTTP_400_BAD_REQUEST,
                data={"error": "Missing playback device name."},
            )

        profile: StreamingProfile = self.request.user.streamingprofile
        with transaction.atomic():
            pd = PlaybackDevice.objects.create(
                playback_state=profile.playback_state, name=request.data["name"]
            )
            # No active device --> set this one
            if not profile.playback_state.active_device():
                pd.is_active = True
                pd.save()
                profile.playback_state.is_active = False
                profile.playback_state.save()
                send_ws_event(
                    f"user_{self.request.user.uuid}",
                    event_handler="base.event",
                    event_name="invalidate.query",
                    query_key=["playback"],
                )

        return Response(
            status=status.HTTP_201_CREATED, data=PlaybackDeviceSerializer(pd).data
        )


class PlaybackDeviceActivateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        profile: StreamingProfile = self.request.user.streamingprofile
        device_uuid = kwargs["uuid"]
        with transaction.atomic():
            playback_state = profile.playback_state

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

        send_ws_event(
            f"user_{self.request.user.uuid}",
            event_handler="base.event",
            event_name="invalidate.query",
            query_key=["playback"],
        )
        return Response(status=status.HTTP_204_NO_CONTENT)


# TODO: think of smth better, probably just every sec updates with websockets
# TODO: change for session auth instead of jwt
# @method_decorator(
#     csrf_exempt, name="dispatch"
# )  # receives a sendBeacon request, which doesn't have CSRF token
# class PlaybackDeviceDeleteView(APIView):
#     def post(self, request, *args, **kwargs):
#         data = json.loads(request.body)
#         token = data.get("token")
#         device_uuid = data.get("uuid")
#         if not token or not device_uuid:
#             return Response({"error": "Missing token or device_id"}, status=400)
#
#         try:
#             token = RefreshToken(token)
#             user_uuid = token["uuid"]
#         except Exception:
#             return Response({"error": "Invalid token"}, status=401)
#
#         with transaction.atomic():
#             user = get_object_or_404(StreamingUser, uuid=user_uuid)
#             pd = get_object_or_404(
#                 PlaybackDevice, playback_state=user.playback_state, uuid=device_uuid
#             )
#             was_active = pd.is_active
#             pd.delete()
#             if was_active:
#                 devices = user.playback_state.playbackdevice_set.all()
#                 if devices:
#                     devices[0].is_active = True
#                     devices[0].save()
#                 user.playback_state.is_playing = False
#                 user.playback_state.save()
#
#         send_ws_event(f"user_{user.uuid}", event_handler="base.event", event_name="invalidate.query", query_key=["playback"])
#         return Response(status=status.HTTP_204_NO_CONTENT)


class PlaybackStateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        playback_state = self.request.user.streamingprofile.playback_state
        playback_state = PlaybackStateSerializer(playback_state).data
        return Response(status=status.HTTP_200_OK, data=playback_state)

    def post(self, request, *args, **kwargs):
        is_playing = self.request.data.get("is_playing")
        if is_playing is None:
            return Response(
                status=status.HTTP_400_BAD_REQUEST,
                data={"error": "Missing is_playing attribute."},
            )

        profile: StreamingProfile = request.user.streamingprofile

        playback_state = profile.playback_state
        playback_state.is_playing = is_playing
        playback_state.save()

        send_ws_event(
            f"user_{self.request.user.uuid}",
            event_handler="base.event",
            event_name="invalidate.query",
            query_key=["playback"],
        )
        return Response(status=status.HTTP_204_NO_CONTENT)
