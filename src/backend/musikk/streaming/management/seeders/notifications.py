from notifications.models import (
    ChatMessageNotification,
    FollowerNotification,
    ReplyNotification,
)
from social.models.chat import Chat
from social.models.publication import Publication
from users.models import BaseUser
from users.models.connections import UserFollow


def seed_notifications(
    follows: list[UserFollow],
    publications: list[Publication],
    chat_messages: list[tuple[Publication, Chat, BaseUser]],
    chat_members_map: dict[int, list[BaseUser]],
):
    follower_count = _seed_follower_notifications(follows)
    reply_count = _seed_reply_notifications(publications)
    chat_count = _seed_chat_message_notifications(chat_messages, chat_members_map)

    print(
        f"Generated {follower_count + reply_count + chat_count} notifications "
        f"({follower_count} follow, {reply_count} reply, {chat_count} chat)"
    )


def _seed_follower_notifications(follows: list[UserFollow]) -> int:
    notifs = [
        FollowerNotification(sender=f.from_user, receiver=f.to_user) for f in follows
    ]
    FollowerNotification.objects.bulk_create(notifs)
    return len(notifs)


def _seed_reply_notifications(publications: list[Publication]) -> int:
    replies = [p for p in publications if p.parent is not None and p.parent.author]
    notifs = [
        ReplyNotification(orig_publication=p.parent, reply_publication=p)
        for p in replies
    ]
    ReplyNotification.objects.bulk_create(notifs)
    return len(notifs)


def _seed_chat_message_notifications(
    chat_messages: list[tuple[Publication, Chat, BaseUser]],
    chat_members_map: dict[int, list[BaseUser]],
) -> int:
    notifs: list[ChatMessageNotification] = []
    for msg, chat, sender in chat_messages:
        members = chat_members_map.get(chat.pk, [])
        for member in members:
            if member.pk != sender.pk:
                notifs.append(
                    ChatMessageNotification(message=msg, chat=chat, receiver=member)
                )
    ChatMessageNotification.objects.bulk_create(notifs)
    return len(notifs)
