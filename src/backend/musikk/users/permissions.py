from rest_framework.permissions import BasePermission

from users.models import Artist, BaseUser


# TODO: add IsAdminOrSelf


class IsArtist(BasePermission):
    def has_permission(self, request, view):
        return Artist.objects.filter(uuid__in=[request.user.uuid])


class IsSelfOrFriend(BasePermission):
    def has_object_permission(self, request, view, obj):
        if obj == request.user:
            return True

        return request.user in obj.friends
