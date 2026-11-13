from base.models import BaseModel
from django.db.models import QuerySet
from streaming.models import BaseSong, Collection
from streaming.models.collections import CollectionType
from users.models import BaseUser

from social.models.chat import Chat

COMMENTABLE_COLLECTION_TYPES = (CollectionType.ALBUM, CollectionType.PLAYLIST)


class PublicationAccessPolicy:
    """
    Decides who can read and write the publications created for one kind of
    object (`Publication.created_for`), such as a feed, a collection or a
    chat. The publication views, the reply check and the WebSocket topic
    validators all ask the same policy, so they cannot disagree about access.

    A subclass defines the readable objects once, as a queryset. The checks
    on a single object and on a topic uuid both filter that queryset.
    """

    api_type_key: str
    model: type[BaseModel]
    ws_topic_prefix: str | None = None

    def objects_with_publications_readable_by(self, user: BaseUser) -> QuerySet:
        raise NotImplementedError

    def can_read_publications(self, user: BaseUser, obj: BaseModel) -> bool:
        return (
            self.objects_with_publications_readable_by(user).filter(pk=obj.pk).exists()
        )

    def can_read_publications_by_uuid(self, user: BaseUser, uuid: str) -> bool:
        """
        The same check as `can_read_publications`, for callers that only have
        the object's uuid, such as a WebSocket topic validator.
        """
        return (
            self.objects_with_publications_readable_by(user).filter(uuid=uuid).exists()
        )

    def can_create_top_level_publication(self, user: BaseUser, obj: BaseModel) -> bool:
        """
        Decides whether the user can start a new thread on `obj`. Replies are
        allowed to everyone who can read the thread.
        """
        return self.can_read_publications(user, obj)


class FeedPublicationAccessPolicy(PublicationAccessPolicy):
    api_type_key = "feed"
    model = BaseUser

    def objects_with_publications_readable_by(self, user):
        return BaseUser.objects.all()

    def can_create_top_level_publication(self, user, obj):
        return obj == user


class CollectionPublicationAccessPolicy(PublicationAccessPolicy):
    """
    Comments on albums and playlists. Only public collections that are not
    drafts have comments, even for their authors.
    """

    api_type_key = "collection"
    model = Collection
    ws_topic_prefix = "collection_comments"

    def objects_with_publications_readable_by(self, user):
        return Collection.objects.public().published()

    def can_create_top_level_publication(self, user, obj):
        return obj.type in COMMENTABLE_COLLECTION_TYPES and self.can_read_publications(
            user, obj
        )


class ChatPublicationAccessPolicy(PublicationAccessPolicy):
    api_type_key = "chat"
    model = Chat
    ws_topic_prefix = "chat"

    def objects_with_publications_readable_by(self, user):
        return Chat.objects.filter(chatmember__member=user)


class SongPublicationAccessPolicy(PublicationAccessPolicy):
    """
    Comments on a song. A song has one thread, shared by its album and every
    playlist that contains it. Only songs that are out on a public album
    have comments.
    """

    api_type_key = "song"
    model = BaseSong
    ws_topic_prefix = "song_comments"

    def objects_with_publications_readable_by(self, user):
        return BaseSong.objects.published().in_public_published_album()


PUBLICATION_ACCESS_POLICY_BY_MODEL: dict[type[BaseModel], PublicationAccessPolicy] = {
    policy.model: policy
    for policy in (
        FeedPublicationAccessPolicy(),
        CollectionPublicationAccessPolicy(),
        ChatPublicationAccessPolicy(),
        SongPublicationAccessPolicy(),
    )
}


def get_publication_access_policy(obj: BaseModel) -> PublicationAccessPolicy:
    return PUBLICATION_ACCESS_POLICY_BY_MODEL[type(obj)]
