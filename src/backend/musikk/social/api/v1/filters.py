from django.contrib.contenttypes.models import ContentType
from django_filters import rest_framework as filters

from social.models import Publication
from users.models import BaseUser


class PublicationFilter(filters.FilterSet):
    connection = filters.CharFilter(method="filter_connection_type")
    amount = filters.NumberFilter(method="filter_count")

    class Meta:
        model = Publication
        fields = ["connection"]

    def filter_connection_type(self, queryset, name, value):
        feed_content_type = ContentType.objects.get_for_model(BaseUser)
        base_qs = queryset.filter(
            parent__isnull=True,
            created_for_type=feed_content_type
        )
        
        match value:
            case "friends":
                return base_qs.filter(
                    author__in=self.request.user.friends.all()
                ).order_by("-date_added")[:50]
            case "followed":
                return base_qs.filter(
                    author__in=self.request.user.followed_users.all()
                ).order_by("-date_added")[:50]
            case _:
                return queryset.none()
