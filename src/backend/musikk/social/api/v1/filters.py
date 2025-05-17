from django_filters import rest_framework as filters

from social.models import Publication


class PublicationFilter(filters.FilterSet):
    connection = filters.CharFilter(method="filter_connection_type")
    amount = filters.NumberFilter(method="filter_count")

    class Meta:
        model = Publication
        fields = ["connection"]

    def filter_connection_type(self, queryset, name, value):
        user = self.request.user.streaminguser
        match value:
            case "friends":
                return queryset.filter(user__in=user.friends.all()).order_by(
                    "-date_added"
                )[:50]
            case "followed":
                return queryset.filter(user__in=user.followed.all()).order_by(
                    "-date_added"
                )[:50]
            case _:
                return queryset.none()