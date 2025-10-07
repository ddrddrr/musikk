from rest_framework.permissions import BasePermission, SAFE_METHODS

from users.models import StreamingProfile, ArtistProfile

# TODO: add IsAdminOrSelf

class IsProfileOwnerOrReadOnly(BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        return obj.user == request.user


class HasStreamingProfile(BasePermission):
    def has_permission(self, request, view):
        return StreamingProfile.objects.filter(user=request.user).exists()


class HasArtistProfile(BasePermission):
    def has_permission(self, request, view):
        return ArtistProfile.objects.filter(user=request.user).exists()
