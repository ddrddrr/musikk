from django_filters import rest_framework as filters

from social.models import Publication


class PublicationConnectionFilter(filters.FilterSet):
    connection = filters.CharFilter(method="filter_connection_type")

    class Meta:
        model = Publication
        fields = ["connection"]

    def filter_connection_type(self, queryset, name, value):
        # top-level only
        base_qs = queryset.filter(parent__isnull=True)

        match value:
            case "mine":
                return base_qs.filter(author=self.request.user)
            case "friends":
                return base_qs.filter(author__in=self.request.user.friends.all())
            case "followed":
                return base_qs.filter(author__in=self.request.user.following)
            case _:
                return base_qs
