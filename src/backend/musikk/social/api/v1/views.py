from rest_framework.views import APIView
from rest_framework.generics import get_object_or_404
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from notifications.models import ReplyNotification
from social.api.v1.serializers import (
    PublicationRetrieveSerializer,
    PublicationCreateSerializer,
)
from social.models import Publication
from sse.config import EventChannels
from sse.events import send_invalidate_event
from users.users_extended import StreamingUser


class CommentsListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        obj_uuid = kwargs["obj_uuid"]
        obj_type = kwargs["obj_type"]

        related_instance = Publication.lookup_related_instance(obj_type, obj_uuid)
        comments = PublicationRetrieveSerializer(
            related_instance.comments.all(), many=True
        ).data
        return Response(status=status.HTTP_200_OK, data=comments)

    def post(self, request, *args, **kwargs):
        data = request.data.copy()
        user = request.user.streaminguser
        data["user"] = user.pk
        data["obj_uuid"] = kwargs["obj_uuid"]
        data["obj_type"] = kwargs["obj_type"]

        serializer = PublicationCreateSerializer(data={**data, "type": "comment"})
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

        return Response(status=status.HTTP_201_CREATED)


class PostListCreateView(APIView):
    # permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = get_object_or_404(StreamingUser, uuid=kwargs["uuid"])

        def construct_post_tree(posts):
            post_tree = []
            for post in posts:
                post_tree.append(
                    {
                        **PublicationRetrieveSerializer(post).data,
                        "children": construct_post_tree(
                            Publication.objects.filter(type="post", parent=post)
                        ),
                    }
                )

            return post_tree

        roots = Publication.objects.filter(type="post", user=user, parent__isnull=True)
        return Response(status=status.HTTP_200_OK, data=construct_post_tree(roots))

    def post(self, request, *args, **kwargs):
        data = request.data.copy()
        user = request.user.streaminguser
        data["user"] = user.pk

        serializer = PublicationCreateSerializer(data={**data, "type": "post"})
        serializer.is_valid(raise_exception=True)
        obj = serializer.save()

        if data.get("parent"):
            ReplyNotification.objects.create(
                orig_comment=obj.parent,
                reply_comment=obj,
            )

        send_invalidate_event(
            EventChannels.user_events(user.uuid),
            ["posts", str(obj.get_root().user.uuid)],
        )

        return Response(status=status.HTTP_201_CREATED)
