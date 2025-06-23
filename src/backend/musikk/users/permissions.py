from rest_framework import permissions

from users.models import StreamingProfile, ArtistProfile


class HasStreamingProfile(permissions.BasePermission):
    def has_permission(self, request, view):
        return StreamingProfile.objects.filter(user=request.user).exists()


class HasArtistProfile(permissions.BasePermission):
    def has_permission(self, request, view):
        return ArtistProfile.objects.filter(user=request.user).exists()
