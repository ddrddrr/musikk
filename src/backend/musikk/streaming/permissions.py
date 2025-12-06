from rest_framework.permissions import BasePermission

from streaming.models import Collection


class IsPublicOrCollectionAuthor(BasePermission):
    def has_object_permission(self, request, view, obj):
        if isinstance(obj, Collection) or (obj := getattr(obj, "collection")):
            if not obj.private:
                return True
            return obj.authors.filter(uuid=request.user.uuid).exists()

        return False
