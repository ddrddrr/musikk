from django.contrib.contenttypes.models import ContentType
from django.db.models import Model
from musikk.pagination import BaseLimitOffsetPagination
from rest_framework.exceptions import PermissionDenied
from rest_framework.mixins import CreateModelMixin, ListModelMixin

from social.api.v1.serializers import (
    PublicationCreateSerializer,
    PublicationRetrieveSerializer,
)
from social.models import Publication


class PublicationsListCreateMixin(ListModelMixin, CreateModelMixin):
    pagination_class = BaseLimitOffsetPagination
    list_top_level_only = True

    def get_created_for(self) -> Model:
        raise NotImplementedError

    def check_list_permission(self, created_for: Model) -> bool:
        """Check permission for listing publications. Override to customize."""
        raise NotImplementedError

    def check_create_permission(self, created_for: Model) -> bool:
        """Check permission for creating publications. Override to customize."""
        raise NotImplementedError

    def create(self, request, *args, **kwargs):
        if not self.check_create_permission(self.get_created_for()):
            raise PermissionDenied()
        resp = super().create(request, *args, **kwargs)
        self.ws_on_create()
        return resp

    def perform_create(self, serializer):
        serializer.save(created_for_object=self.get_created_for())
        self._created_publication = serializer.instance

    def ws_on_create(self):
        raise NotImplementedError

    def get_queryset(self):
        created_for = self.get_created_for()
        if not self.check_list_permission(created_for):
            raise PermissionDenied()
        ct = ContentType.objects.get_for_model(created_for)
        qs = Publication.objects.filter(
            created_for_type=ct, created_for_id=created_for.pk
        )
        if self.list_top_level_only:
            qs = qs.filter(parent__isnull=True)
        return qs.select_related("author").order_by("-date_added")

    def get_serializer_class(self):
        return (
            PublicationCreateSerializer
            # todo check
            if self.request.method == "POST"
            else PublicationRetrieveSerializer
        )
