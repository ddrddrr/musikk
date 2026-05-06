from django.db.models import Q
from django_filters import rest_framework as filters
from users.models import UserFollow

from streaming.models.collections import Collection, CollectionType


class CollectionFilter(filters.FilterSet):
    type = filters.MultipleChoiceFilter(
        field_name="type",
        choices=CollectionType.choices,
    )
    connection = filters.CharFilter(method="filter_connection")
    author = filters.UUIDFilter(method="filter_author")

    class Meta:
        model = Collection
        fields = ["type", "connection", "author"]

    def filter_author(self, queryset, name, value):
        return queryset.filter(collection_credits__author__uuid=value).distinct()

    def filter_connection(self, queryset, name, value):
        if value == "friends":
            user_ids = self.request.user.friends.values_list("pk", flat=True)
        elif value == "followed":
            user_ids = UserFollow.objects.filter(
                from_user=self.request.user
            ).values_list("to_user_id", flat=True)
        else:
            return queryset.none()

        return queryset.filter(
            Q(followers__user__in=user_ids) | Q(collection_credits__author__in=user_ids)
        ).distinct()
