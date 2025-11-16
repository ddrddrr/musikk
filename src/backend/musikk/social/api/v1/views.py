from rest_framework.views import APIView
from rest_framework.generics import get_object_or_404, RetrieveAPIView, ListAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django_filters import rest_framework as filters

from notifications.models import ReplyNotification
from social.api.v1.filters import PublicationFilter
from social.api.v1.serializers import (
    PublicationRetrieveSerializer,
    PublicationCreateSerializer,
)
from social.models import Publication
from websockets.event_helpers import send_ws_event
from users.models import StreamingProfile, BaseUser


class CommentsListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        obj_uuid = kwargs["obj_uuid"]
        obj_type = kwargs["obj_type"]

        related_instance = Publication.lookup_related_instance(obj_type, obj_uuid)
        comments = PublicationRetrieveSerializer(
            related_instance.comments.all(), many=True, context={"request": request}
        ).data
        return Response(status=status.HTTP_200_OK, data=comments)

    def post(self, request, *args, **kwargs):
        data = request.data.copy()
        user = request.user
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
            send_ws_event(f"user_{user.uuid}", event_handler="base.event", event_name="invalidate.query", query_key=["comments", data["obj_uuid"]])

        return Response(status=status.HTTP_201_CREATED)


class PostCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        data = request.data.copy()
        user = request.user
        data["user"] = user.pk

        serializer = PublicationCreateSerializer(data={**data, "type": "post"})
        serializer.is_valid(raise_exception=True)
        obj = serializer.save()

        if data.get("parent"):
            ReplyNotification.objects.create(
                orig_comment=obj.parent,
                reply_comment=obj,
            )
            send_ws_event(f"user_{user.uuid}", event_handler="base.event", event_name="invalidate.query", query_key=["posts", "children", str(obj.parent.uuid)])
        else:
            send_ws_event(f"user_{user.uuid}", event_handler="base.event", event_name="invalidate.query", query_key=["posts", "user", str(obj.get_root().user.uuid)])

        return Response(status=status.HTTP_201_CREATED)


class PostRetrieveView(RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    queryset = Publication.objects.filter(type="post").order_by("-date_added")
    serializer_class = PublicationRetrieveSerializer
    lookup_field = "uuid"


class PostUserListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = get_object_or_404(BaseUser, uuid=kwargs["uuid"])

        roots = PublicationRetrieveSerializer(
            Publication.objects.filter(
                type="post", user=user, parent__isnull=True
            ).order_by("-date_added"),
            many=True,
            context={"request": request},
        ).data
        return Response(
            status=status.HTTP_200_OK,
            data=roots,
        )


class PostChildrenListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        children = PublicationRetrieveSerializer(
            Publication.objects.filter(
                type="post", parent__uuid=kwargs["uuid"]
            ).order_by("-date_added"),
            many=True,
            context={"request": request},
        ).data
        return Response(status=status.HTTP_200_OK, data=children)


class PostsLatestView(ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = PublicationRetrieveSerializer
    queryset = Publication.objects.all()
    filter_backends = [filters.DjangoFilterBackend]
    filterset_class = PublicationFilter
    default_amount = 50

    def get_filterset(self, *args, **kwargs):
        query_params = self.request.query_params.copy()
        if "amount" not in query_params:
            query_params["amount"] = 50
        kwargs["data"] = query_params
        return self.filterset_class(
            *args, request=self.request, queryset=self.get_queryset(), **kwargs
        )
