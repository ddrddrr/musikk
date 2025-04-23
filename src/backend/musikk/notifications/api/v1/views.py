from rest_framework.generics import ListAPIView, UpdateAPIView, GenericAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from notifications.api.v1.serializers import ReplyNotificationSerializer
from notifications.models import ReplyNotification
from django_eventstream.viewsets import EventsViewSet


class ReplyNotificationListView(ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ReplyNotificationSerializer
    queryset = ReplyNotification.objects.all()

    def get_queryset(self):
        user = self.request.user
        return ReplyNotification.objects.filter(orig_comment__user=user)


class ReplyNotificationSetReadView(GenericAPIView):
    permission_classes = [IsAuthenticated]
    queryset = ReplyNotification.objects.all()

    def patch(self, request, *args, **kwargs):
        notif_uuids = self.request.data["uuids"]
        ReplyNotification.objects.filter(uuid__in=notif_uuids).update(is_read=True)
        return Response(status=status.HTTP_204_NO_CONTENT)


class ReplyNotificationEventViewSet(EventsViewSet):
    permission_classes = [IsAuthenticated]

    def list(self, request, uuid=None):
        if uuid:
            self.channels = [f"notifications/replies/events/{uuid}"]
        return super().list(request)
