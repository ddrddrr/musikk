from rest_framework.generics import ListAPIView
from rest_framework.permissions import IsAuthenticated

from notifications.api.v1.serializers import ReplyNotificationSerializer
from notifications.models import ReplyNotification
from django_eventstream.viewsets import EventsViewSet


class ReplyNotificationListView(ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ReplyNotificationSerializer
    queryset = ReplyNotification.objects.all()


class ReplyNotificationEventViewSet(EventsViewSet):
    permission_classes = [IsAuthenticated]

    def list(self, request, uuid=None):
        if uuid:
            self.channels = [f"notifications/replies/events/{uuid}"]
        return super().list(request)
