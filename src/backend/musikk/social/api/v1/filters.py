from django_filters import rest_framework as filters

from social.models import Publication
from users.models import StreamingProfile


class PublicationFilter(filters.FilterSet):
    connection = filters.CharFilter(method="filter_connection_type")
    amount = filters.NumberFilter(method="filter_count")

    class Meta:
        model = Publication
        fields = ["connection"]

    def filter_connection_type(self, queryset, name, value):
        profile: StreamingProfile = self.request.user.streamingprofile
        match value:
            case "friends":
                return queryset.filter(
                    user__streamingprofile__in=profile.friends.all()
                ).order_by("-date_added")[:50]
            case "followed":
                return queryset.filter(
                    user__streamingprofile__in=profile.followed.all()
                ).order_by("-date_added")[:50]
            case _:
                return queryset.none()
