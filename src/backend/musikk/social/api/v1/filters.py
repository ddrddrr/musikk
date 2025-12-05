from django_filters import rest_framework as filters

from social.models import Publication


class PublicationFilter(filters.FilterSet):
    connection = filters.CharFilter(method="filter_connection_type")
    amount = filters.NumberFilter(method="filter_count")

    class Meta:
        model = Publication
        fields = ["connection"]

    def filter_connection_type(self, queryset, name, value):
        match value:
            case "friends":
                return queryset.filter(
                    author__in=self.request.user.friends.all()
                ).order_by("-date_added")[:50]
            case "followed":
                return queryset.filter(
                    author__in=self.request.user.followed_users.all()
                ).order_by("-date_added")[:50]
            case _:
                return queryset.none()
