from django.contrib.contenttypes.models import ContentType
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.generics import RetrieveAPIView, ListCreateAPIView

from social.api.v1.filters import PublicationFilter
from social.api.v1.serializers import (
    PublicationCreateSerializer,
    PublicationRetrieveSerializer,
    PublicationRetrieveWithChildrenSerializer,
)
from social.api.v1.type_model_maps import (
    CREATED_FOR_RESOLVER,
)
from social.models import Publication
from users.models import BaseUser
from websockets.event_helpers import send_ws_event


class PublicationListCreateForObjView(ListCreateAPIView):
    serializer_class = PublicationRetrieveSerializer  # for GET

    def get_created_for_obj(self):
        return CREATED_FOR_RESOLVER.resolve_model_instance(
            {"type": self.kwargs["obj_type"], "uuid": str(self.kwargs["obj_uuid"])}
        )

    def get_queryset(self):
        created_for_obj = self.get_created_for_obj()
        return (
            Publication.objects.filter(
                created_for_type=ContentType.objects.get_for_model(
                    created_for_obj.__class__
                ),
                created_for_id=created_for_obj.pk,
            ).select_related("author", "parent", "parent__author")
            # newest first
            .order_by("-date_added")
        )

    def create(self, request, *args, **kwargs):
        created_for_obj = self.get_created_for_obj()
        serializer = PublicationCreateSerializer(
            data=request.data,
            context={"request": request, "created_for_obj": created_for_obj},
        )
        serializer.is_valid(raise_exception=True)
        obj = serializer.save()

        created_for_ref = CREATED_FOR_RESOLVER.get_model_instance_representation(
            created_for_obj
        )
        send_ws_event(
            f"user_{request.user.uuid}",
            event_name="invalidate.query",
            query_key=[
                "publications",
                created_for_ref["type"],
                created_for_ref["uuid"],
            ],
        )

        return Response(
            status=status.HTTP_201_CREATED,
            data={
                "publication": PublicationRetrieveSerializer(
                    obj, context={"request": request}
                ).data
            },
        )

# TODO: this also should be a list view, but children arr should be only 1 level deep...
class PublicationRetrieveView(RetrieveAPIView):
    queryset = Publication.objects.select_related("author", "parent").prefetch_related(
        "replies__author"
    )
    serializer_class = PublicationRetrieveWithChildrenSerializer
    lookup_field = "uuid"


class PublicationFeedLatestView(APIView):
    def get(self, request, *args, **kwargs):
        queryset = Publication.objects.all()

        filterset = PublicationFilter(request.GET, queryset=queryset, request=request)
        if filterset.is_valid():
            filtered_qs = filterset.qs
        else:
            feed_content_type = ContentType.objects.get_for_model(BaseUser)
            filtered_qs = queryset.filter(
                parent__isnull=True, created_for_type=feed_content_type
            ).order_by("-date_added")[:50]

        serializer = PublicationRetrieveSerializer(
            filtered_qs, many=True, context={"request": request}
        )
        return Response(status=status.HTTP_200_OK, data=serializer.data)
