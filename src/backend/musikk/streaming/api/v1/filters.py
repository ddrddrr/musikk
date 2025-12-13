from django_filters import rest_framework as filters

from streaming.models.collections import Collection, CollectionType
from users.models import UserFollow


class CollectionFilter(filters.FilterSet):
    type = filters.MultipleChoiceFilter(
        field_name="type",
        choices=CollectionType.choices,
    )
    connection = filters.CharFilter(method="filter_connection")

    class Meta:
        model = Collection
        fields = ["type", "connection"]

    def filter_connection(self, queryset, name, value):
        collection_ids = []
        if value == "friends":
            collection_ids = []
            for friend in self.request.user.friends:
                collection_ids.extend(
                    friend.streamingprofile.followed_collections.values_list(
                        "id", flat=True
                    )
                )

        elif value == "followed":
            for followed_user in UserFollow.objects.filter(from_user=self.request.user):
                collection_ids.extend(
                    followed_user.streamingprofile.followed_collections.values_list(
                        "id", flat=True
                    )
                )

        return queryset.filter(id__in=collection_ids).distinct()
