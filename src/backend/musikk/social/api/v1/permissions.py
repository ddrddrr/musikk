from streaming.models import Collection
from users.models import BaseUser

from social.models import Publication
from social.models.chat import Chat, ChatMember


def can_view_target(user, target) -> bool:
    if isinstance(target, BaseUser):
        return True
    if isinstance(target, Collection):
        return not target.private
    if isinstance(target, Chat):
        return ChatMember.objects.filter(chat=target, member=user).exists()
    return False


def can_reply_under(user, parent: Publication, created_for) -> bool:
    if parent.get_root().created_for_object != created_for:
        return False
    return can_view_target(user, created_for)
