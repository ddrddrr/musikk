from django_filters import rest_framework as filters

from streaming.models.collections import Collection, CollectionType
from users.models import UserFollow


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
            for follow_obj in UserFollow.objects.filter(from_user=self.request.user):
                collection_ids.extend(
                    follow_obj.to_user.streamingprofile.followed_collections.values_list(
                        "id", flat=True
                    )
                )

        return queryset.filter(id__in=collection_ids).distinct()
