from rest_framework.permissions import BasePermission
from users.models import UserRole

from streaming.models import Collection


def _get_collection(obj):
    if isinstance(obj, Collection):
        return obj
    return getattr(obj, "collection", None)


def _is_collection_author(user, collection: Collection) -> bool:
    if collection is None or not getattr(user, "uuid", None):
        return False
    return collection.authors.filter(uuid=user.uuid).exists()


class IsPublicOrCollectionAuthor(BasePermission):
    def has_object_permission(self, request, view, obj):
        collection = _get_collection(obj)
        if collection is None:
            return False

        if collection.draft:
            return False

        if collection.private:
            return _is_collection_author(request.user, collection)

        return True


class IsCollecitonAuthor(BasePermission):
    def has_object_permission(self, request, view, obj):
        collection = _get_collection(obj)
        return _is_collection_author(request.user, collection)


# TODO: revise that, in general a single model/endpoint for all collection management wasn't a very
# good idea...
class IsArtistForAlbumCreation(BasePermission):
    def has_permission(self, request, view):
        if request.method != "POST":
            return True
        if request.data.get("type") != "album":
            return True
        user = getattr(request, "user", None)
        return bool(user and user.role == UserRole.ARTIST)
