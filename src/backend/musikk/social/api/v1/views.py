from rest_framework.generics import GenericAPIView
from rest_framework.mixins import CreateModelMixin
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from django_eventstream import send_event
from django_eventstream.viewsets import EventsViewSet

from notifications.models import ReplyNotification
from social.api.v1.serializers import CommentSerializer
from social.models import Comment


class CommentListCreateView(CreateModelMixin, GenericAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = CommentSerializer
    queryset = Comment.objects.all()

    def get(self, request, *args, **kwargs):
        obj_type = request.query_params.get("obj-type")
        obj_uuid = request.query_params.get("obj-uuid")

        if not obj_type or not obj_uuid:
            raise ValidationError("Both obj_type and obj_uuid are required")

        related_instance = Comment.lookup_related_instance(obj_type, obj_uuid)
        serializer = self.get_serializer(related_instance.comments, many=True)
        return Response(serializer.data)

    def post(self, request, *args, **kwargs):
        request.data["user"] = request.user.pk
        obj_type = request.query_params.get("obj-type")
        obj_uuid = request.data.get("obj-uuid")
        request.data["obj_type"] = obj_type
        request.data["obj_uuid"] = obj_uuid
        obj = self.create(request, *args, **kwargs)

        send_event(f"comments/events/{obj_uuid}", "message", {"invalidate": ""})
        if request.data.get("parent"):
            ReplyNotification.objects.create(
                orig_comment=obj.parent,
                reply_comment=obj,
            )

        return obj


class CommentEventViewSet(EventsViewSet):
    permission_classes = [IsAuthenticated]

    def list(self, request, uuid=None):
        if uuid:
            self.channels = [f"comments/events/{uuid}"]
        return super().list(request)
