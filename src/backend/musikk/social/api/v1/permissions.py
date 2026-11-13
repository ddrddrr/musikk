from social.models import Publication
from social.publication_access_policies import get_publication_access_policy


def can_read_thread_of(user, publication: Publication) -> bool:
    """
    A reply has no `created_for` access rules of its own, so access comes from
    the object its root publication was created for. A thread whose object
    was deleted cannot be read.
    """
    created_for = publication.get_root().created_for_object
    if created_for is None:
        return False
    return get_publication_access_policy(created_for).can_read_publications(
        user, created_for
    )


def can_reply_under(user, parent: Publication, created_for) -> bool:
    if parent.get_root().created_for_object != created_for:
        return False
    return can_read_thread_of(user, parent)
