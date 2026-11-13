from django.contrib.contenttypes.models import ContentType
from django.db.models import Model
from drf_spectacular.utils import extend_schema, extend_schema_view
from musikk.pagination import BaseLimitOffsetPagination
from rest_framework.exceptions import PermissionDenied
from rest_framework.generics import get_object_or_404
from rest_framework.mixins import CreateModelMixin, ListModelMixin

from social.api.v1.permissions import can_reply_under
from social.api.v1.serializers import (
    PublicationCreateSerializer,
    PublicationRetrieveSerializer,
)
from social.models import Publication
from social.publication_access_policies import PublicationAccessPolicy

PUBLICATION_CREATE_SCHEMA = extend_schema_view(
    post=extend_schema(responses={201: PublicationRetrieveSerializer})
)
"""
`PublicationCreateSerializer` answers with the retrieve shape, which the
generator cannot see. Apply it to every view that uses the mixin below.
"""


class PublicationsListCreateMixin(ListModelMixin, CreateModelMixin):
    """
    Lists and creates the publications of the object whose uuid is in the URL
    under `created_for_url_kwarg`. The `access_policy` decides who can read
    them and who can start a new thread. Subclasses only add what happens
    after a publication is created, in `ws_on_create`.
    """

    queryset = Publication.objects.none()
    pagination_class = BaseLimitOffsetPagination
    list_top_level_only = True
    access_policy: PublicationAccessPolicy
    created_for_url_kwarg: str

    def get_created_for(self) -> Model:
        return get_object_or_404(
            self.access_policy.model, uuid=self.kwargs[self.created_for_url_kwarg]
        )

    def check_create_permission(self, created_for: Model) -> bool:
        parent_uuid = self.request.data.get("parent_uuid")
        if not parent_uuid:
            return self.access_policy.can_create_top_level_publication(
                self.request.user, created_for
            )
        parent = Publication.objects.filter(uuid=parent_uuid).first()
        if not parent:
            return False
        return can_reply_under(self.request.user, parent, created_for)

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
        if not self.access_policy.can_read_publications(self.request.user, created_for):
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
