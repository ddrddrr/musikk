from rest_framework.generics import GenericAPIView
from rest_framework.mixins import CreateModelMixin
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from social.api.v1.serializers import CommentSerializer
from social.models import Comment
from streaming.song_collections import SongCollection
from streaming.songs import BaseSong


class CommentListCreateView(CreateModelMixin, GenericAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = CommentSerializer
    queryset = Comment.objects.all()

    def get(self, request, *args, **kwargs):
        obj_type = request.query_params.get("obj_type")
        obj_uuid = request.query_params.get("uuid")

        if not obj_type or not obj_uuid:
            raise ValidationError("Both obj_type and uuid are required")

        match obj_type:
            case "collection":
                model = SongCollection
            case "song":
                model = BaseSong
            case _:
                raise ValidationError(f"Invalid obj_type provided: {obj_type}")

        try:
            obj = model.objects.get(uuid=obj_uuid)
        except model.DoesNotExist:
            raise ValidationError(f"No object found with uuid: {obj_uuid}")

        comments = Comment.objects.filter(parent=obj)
        serializer = self.get_serializer(comments, many=True)
        return Response(serializer.data)

    def post(self, request, *args, **kwargs):
        return self.create(request, *args, **kwargs)
