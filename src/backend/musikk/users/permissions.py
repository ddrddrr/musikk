from rest_framework.permissions import BasePermission

from users.models import Artist


# TODO: add IsAdminOrSelf


class IsArtist(BasePermission):
    def has_permission(self, request, view):
        return Artist.objects.filter(uuid__in=[request.user.uuid])
