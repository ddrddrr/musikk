from rest_framework.mixins import ListModelMixin, CreateModelMixin
from django.db.models import Model
from django.contrib.contenttypes.models import ContentType

from social.models import Publication
from social.api.v1.serializers import (
    PublicationCreateSerializer,
    PublicationRetrieveSerializer,
)


class PublicationsListCreateMixin(ListModelMixin, CreateModelMixin):
    def get_created_for(self) -> Model:
        raise NotImplementedError

    def check_list_permission(self, created_for: Model):
        """Check permission for listing publications. Override to customize."""
        raise NotImplementedError

    def check_create_permission(self, created_for: Model):
        """Check permission for creating publications. Override to customize."""
        raise NotImplementedError

    def create(self, request, *args, **kwargs):
        self.check_create_permission(self.get_created_for())
        resp = super().create(request, *args, **kwargs)
        self.ws_on_create()
        return resp

    def perform_create(self, serializer):
        serializer.save(created_for_object=self.get_created_for())

    def ws_on_create(self):
        raise NotImplementedError

    def get_queryset(self):
        created_for = self.get_created_for()
        self.check_list_permission(created_for)
        ct = ContentType.objects.get_for_model(created_for)
        return (
            Publication.objects.filter(
                created_for_type=ct, created_for_id=created_for.pk, parent__isnull=True
            )
            .select_related("author")
            .order_by("-date_added")
        )

    def get_serializer_class(self):
        return (
            PublicationCreateSerializer
            # todo check
            if self.request.method == "POST"
            else PublicationRetrieveSerializer
        )
