from rest_framework.permissions import BasePermission

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

        if not collection.private:
            return True

        return _is_collection_author(request.user, collection)


class IsCollecitonAuthor(BasePermission):
    def has_object_permission(self, request, view, obj):
        collection = _get_collection(obj)
        return _is_collection_author(request.user, collection)