from rest_framework.views import APIView
from rest_framework.generics import get_object_or_404, RetrieveAPIView
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


class PostCreateView(APIView):
    permission_classes = [IsAuthenticated]

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
                ["posts", "children", str(obj.parent.uuid)],
            )
        else:
            send_invalidate_event(
                EventChannels.user_events(user.uuid),
                ["posts", "user", str(obj.get_root().user.uuid)],
            )

        return Response(status=status.HTTP_201_CREATED)


class PostRetrieveView(RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    queryset = Publication.objects.filter(type="post").order_by("-date_added")
    serializer_class = PublicationRetrieveSerializer
    lookup_field = "uuid"


class PostUserListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = get_object_or_404(StreamingUser, uuid=kwargs["uuid"])

        roots = Publication.objects.filter(
            type="post", user=user, parent__isnull=True
        ).order_by("-date_added")
        return Response(
            status=status.HTTP_200_OK,
            data=PublicationRetrieveSerializer(roots, many=True).data,
        )


class PostChildrenListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        children = PublicationRetrieveSerializer(
            Publication.objects.filter(
                type="post", parent__uuid=kwargs["uuid"]
            ).order_by("-date_added"),
            many=True,
        ).data
        return Response(status=status.HTTP_200_OK, data=children)


class PostsLatestFollowedView(APIView):
    permission_classes = [IsAuthenticated]
    post_count = 50

    def get(self, request, *args, **kwargs):
        user = request.user.streaminguser
        followed_posts = PublicationRetrieveSerializer(
            Publication.objects.filter(user__in=user.followed.all()).order_by(
                "-date_added"
            )[:50],
            many=True,
        ).data

        return Response(
            status=status.HTTP_200_OK,
            data=followed_posts,
        )


class PostsLatestFriendsView(APIView):
    permission_classes = [IsAuthenticated]
    post_count = 50

    def get(self, request, *args, **kwargs):
        user = request.user.streaminguser
        friend_posts = PublicationRetrieveSerializer(
            Publication.objects.filter(user__in=user.friends.all()).order_by(
                "-date_added"
            )[:50],
            many=True,
        ).data

        return Response(
            status=status.HTTP_200_OK,
            data=friend_posts,
        )
