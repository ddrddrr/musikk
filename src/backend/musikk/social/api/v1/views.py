from rest_framework.generics import GenericAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from django_eventstream import send_event
from django_eventstream.viewsets import EventsViewSet

from notifications.models import ReplyNotification
from social.api.v1.serializers import CommentReadSerializer, CommentWriteSerializer
from social.models import Comment


class CommentListCreateView(GenericAPIView):
    permission_classes = [IsAuthenticated]
    queryset = Comment.objects.all()

    def get_serializer_class(self):
        if self.request.method == "POST":
            return CommentWriteSerializer
        return CommentReadSerializer

    def get(self, request, *args, **kwargs):
        obj_type = request.query_params.get("obj-type")
        obj_uuid = request.query_params.get("obj-uuid")

        if not obj_type or not obj_uuid:
            raise ValidationError("Both obj_type and obj_uuid are required")

        related_instance = Comment.lookup_related_instance(obj_type, obj_uuid)
        serializer = self.get_serializer(related_instance.comments.all(), many=True)
        return Response(serializer.data)

    def post(self, request, *args, **kwargs):
        data = request.data.copy()
        data["obj_type"] = data.pop("obj-type")
        data["obj_uuid"] = data.pop("obj-uuid")
        data["user"] = request.user.pk

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        obj = serializer.save()

        if data.get("parent"):
            ReplyNotification.objects.create(
                orig_comment=obj.parent,
                reply_comment=obj,
            )

        if obj.content_object:
            send_event(
                f"comments/events/{data['obj_uuid']}", "message", {"invalidate": ""}
            )

        read_serializer = CommentReadSerializer(
            obj, context=self.get_serializer_context()
        )
        return Response(read_serializer.data, status=201)


class CommentEventViewSet(EventsViewSet):
    permission_classes = [IsAuthenticated]

    def list(self, request, uuid=None):
        if uuid:
            self.channels = [f"comments/events/{uuid}"]
        return super().list(request)
