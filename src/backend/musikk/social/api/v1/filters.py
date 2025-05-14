from django_filters import rest_framework as filters
from social.models import Publication


class PublicationFilter(filters.FilterSet):
    connection = filters.CharFilter(method="filter_connection_type")
    amount = filters.NumberFilter(method="filter_amount")

    class Meta:
        model = Publication
        fields = ["connection", "amount"]

    def filter_connection_type(self, queryset, name, value):
        user = self.request.user.streaminguser
        match value:
            case "friends":
                return queryset.filter(user__in=user.friends.all()).order_by(
                    "-date_added"
                )
            case "followed":
                return queryset.filter(user__in=user.followed.all()).order_by(
                    "-date_added"
                )
            case _:
                return queryset.none()

    def filter_amount(self, queryset, name, value):
        return queryset[:value]
