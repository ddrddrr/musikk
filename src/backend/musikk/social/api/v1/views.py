from rest_framework.generics import GenericAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from notifications.models import ReplyNotification
from social.api.v1.serializers import CommentReadSerializer, CommentWriteSerializer
from social.models import Comment
from sse.config import EventChannels
from sse.events import send_invalidate_event


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
        user = request.user
        data["obj_type"] = data.pop("obj-type")
        data["obj_uuid"] = data.pop("obj-uuid")
        data["user"] = user.pk

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        obj = serializer.save()

        if data.get("parent"):
            ReplyNotification.objects.create(
                orig_comment=obj.parent,
                reply_comment=obj,
            )

        if obj.content_object:
            send_invalidate_event(
                EventChannels.user_events(user.uuid),
                ["comments", data["obj_uuid"]],
            )

        read_serializer = CommentReadSerializer(
            obj, context=self.get_serializer_context()
        )
        return Response(read_serializer.data, status=201)
