from rest_framework.permissions import BasePermission

from users.models import UserRole


class IsArtist(BasePermission):
    def has_permission(self, request, view):
        user = getattr(request, "user", None)
        return bool(user and user.role == UserRole.ARTIST)


class IsSelfOrFriend(BasePermission):
    def has_object_permission(self, request, view, obj):
        user = getattr(request, "user", None)
        if user:
            if obj == request.user:
                return True
            return request.user in obj.friends

        return False