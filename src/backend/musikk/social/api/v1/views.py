from django.contrib.contenttypes.models import ContentType
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response

from social.api.v1.filters import PublicationFilter
from social.api.v1.serializers import (
    PublicationCreateSerializer,
    PublicationRetrieveSerializer,
    PublicationRetrieveWithChildrenSerializer,
)
from social.api.v1.type_to_model_maps import CREATED_FOR_TYPE_TO_MODEL_MAP
from social.models import Publication
from users.models import BaseUser
from websockets.event_helpers import send_ws_event


class PublicationListCreateForObjView(APIView):
    # TODO: proper access rights
    def get(self, request, obj_type, obj_uuid, *args, **kwargs):
        related_model = CREATED_FOR_TYPE_TO_MODEL_MAP.get(obj_type)
        if not related_model:
            return Response(
                {"detail": f"Unknown object type for Publication list: {obj_type}."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            target_obj = related_model.objects.get(uuid=obj_uuid)
        except related_model.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

        content_type = ContentType.objects.get_for_model(related_model)
        # TODO is this valid?
        if request.query_params.get("with_children"):
            queryset = (
                Publication.objects.filter(
                    created_for_type=content_type,
                    created_for_id=target_obj.pk,
                    parent__isnull=True,
                )
                .select_related("author")
                .prefetch_related("replies__author")
            )
            serializer = PublicationRetrieveWithChildrenSerializer
        else:
            queryset = Publication.objects.filter(
                created_for_type=content_type,
                created_for_id=target_obj.pk,
            ).select_related("author")
            serializer = PublicationRetrieveSerializer

        sz_instance = serializer(queryset, many=True, context={"request": request})
        return Response(status=status.HTTP_200_OK, data=sz_instance.data)

    def post(self, request, *args, **kwargs):
        data = request.data.copy()
        # TODO: add logic for post creation for other users (make it impossible, only replies should be allowed)
        serializer = PublicationCreateSerializer(
            data=data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        obj = serializer.save()

        # if obj.content_object:
        #     send_ws_event(
        #         f"user_{request.user.uuid}",
        #         event_handler="base.event",
        #         event_name="invalidate.query",
        #         query_key=["publications", str(data["obj_type"]), str(data["obj_uuid"])],
        #     )

        return Response(
            status=status.HTTP_201_CREATED,
            data={
                "publication": PublicationRetrieveSerializer(
                    obj, context={"request": request}
                ).data,
            },
        )


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
