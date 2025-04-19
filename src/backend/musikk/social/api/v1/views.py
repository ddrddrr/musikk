from rest_framework.generics import GenericAPIView
from rest_framework.mixins import CreateModelMixin
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

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
        request.data["obj_type"] = request.data.get("obj-type")
        request.data["obj_uuid"] = request.data.get("obj-uuid")
        return self.create(request, *args, **kwargs)
