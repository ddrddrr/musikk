from django.contrib.contenttypes.models import ContentType
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from social.api.v1.filters import PublicationFilter
from social.api.v1.serializers import (
    PublicationCreateSerializer,
    PublicationRetrieveSerializer,
    PublicationRetrieveWithChildrenSerializer,
)
from social.api.v1.type_model_maps import (
    CREATED_FOR_RESOLVER,
    UnknownTypeError,
    ObjectDoesNotExistError,
    InvalidRefError,
    TypeToModelError,
)
from social.models import Publication
from users.models import BaseUser
from websockets.event_helpers import send_ws_event


class PublicationListCreateForObjView(APIView):
    def get(self, request, obj_type, obj_uuid, *args, **kwargs):
        try:
            created_for_obj = CREATED_FOR_RESOLVER.resolve_model_instance(
                {"type": obj_type, "uuid": str(obj_uuid)}
            )
        except (UnknownTypeError, InvalidRefError, TypeToModelError) as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except ObjectDoesNotExistError as e:
            return Response({"detail": str(e)}, status=status.HTTP_404_NOT_FOUND)

        content_type = ContentType.objects.get_for_model(created_for_obj.__class__)
        if request.query_params.get("with_children"):
            queryset = (
                Publication.objects.filter(
                    created_for_type=content_type,
                    created_for_id=created_for_obj.pk,
                    parent__isnull=True,
                )
                .select_related("author")
                .prefetch_related("replies__author")
            )
            serializer = PublicationRetrieveWithChildrenSerializer
        else:
            queryset = Publication.objects.filter(
                created_for_type=content_type,
                created_for_id=created_for_obj.pk,
            ).select_related("author")
            serializer = PublicationRetrieveSerializer

        sz_instance = serializer(queryset, many=True, context={"request": request})
        return Response(status=status.HTTP_200_OK, data=sz_instance.data)

    def post(self, request, *args, **kwargs):
        serializer = PublicationCreateSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        obj = serializer.save()

        if created_for := serializer.validated_data.get("created_for"):
            created_for_ref = CREATED_FOR_RESOLVER.get_model_instance_representation(
                created_for
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
