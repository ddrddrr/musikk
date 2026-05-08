import random

from django.contrib.contenttypes.models import ContentType
from faker import Faker
from social.models.chat import Chat, ChatMember
from social.models.publication import Publication
from users.models import BaseUser

from streaming.management.seeders.images import ImageProvider
from streaming.models import BaseSong, Collection, CollectionSong

fake = Faker()


def seed_publications(
    users: list[BaseUser],
    collections: list[Collection],
    songs: list[BaseSong],
    pub_count: int,
    feed_post_count: int,
) -> list[Publication]:
    if not users:
        return []

    publications: list[Publication] = []
    collection_ct = ContentType.objects.get_for_model(Collection)
    user_ct = ContentType.objects.get_for_model(BaseUser)
    collection_song_ct = ContentType.objects.get_for_model(CollectionSong)

    collection_songs = list(
        CollectionSong.objects.filter(collection__in=collections).select_related(
            "song"
        )[:50]
    )

    for _ in range(pub_count):
        if not collections:
            break
        target = random.choice(collections)
        pub = Publication.objects.create(
            author=random.choice(users),
            content=fake.paragraph(nb_sentences=2),
            created_for_type=collection_ct,
            created_for_id=target.pk,
        )

        if collection_songs and random.random() < 0.3:
            cs = random.choice(collection_songs)
            pub.attachment_type = collection_song_ct
            pub.attachment_id = cs.pk
            pub.save(update_fields=["attachment_type", "attachment_id"])

        publications.append(pub)

    # replies to some existing publications
    reply_count = min(pub_count // 3, len(publications))
    for _ in range(reply_count):
        parent = random.choice(publications)
        reply = Publication.objects.create(
            author=random.choice(users),
            content=fake.sentence(),
            created_for_type_id=parent.created_for_type_id,
            created_for_id=parent.created_for_id,
            parent=parent,
        )
        publications.append(reply)

    for _ in range(feed_post_count):
        target_user = random.choice(users)
        pub = Publication.objects.create(
            author=random.choice(users),
            content=fake.paragraph(nb_sentences=3),
            created_for_type=user_ct,
            created_for_id=target_user.pk,
        )
        publications.append(pub)

    print(
        f"Generated {len(publications)} publications "
        f"({pub_count} comments, {reply_count} replies, {feed_post_count} feed posts)"
    )
    return publications


def seed_chats(
    users: list[BaseUser],
    direct_count: int,
    group_count: int,
    image_provider: ImageProvider,
) -> tuple[list[Chat], dict[int, list[BaseUser]]]:
    chats: list[Chat] = []
    members_map: dict[int, list[BaseUser]] = {}

    # direct chats between mutual followers ("friends")
    friend_pairs = _find_friend_pairs(users)
    for i in range(min(direct_count, len(friend_pairs))):
        a, b = friend_pairs[i]
        chat = Chat.objects.create(is_direct=True)
        ChatMember.objects.create(chat=chat, member=a)
        ChatMember.objects.create(chat=chat, member=b)
        chats.append(chat)
        members_map[chat.pk] = [a, b]

    for _ in range(group_count):
        if len(users) < 3:
            break
        size = random.randint(3, min(5, len(users)))
        group_members = random.sample(users, size)
        chat = Chat.objects.create(
            is_direct=False,
            title=fake.bs().title(),
            image=image_provider.get_image(
                width_range=(150, 300), height_range=(150, 300)
            ),
        )
        for member in group_members:
            ChatMember.objects.create(chat=chat, member=member)
        chats.append(chat)
        members_map[chat.pk] = group_members

    print(
        f"Generated {len(chats)} chats "
        f"({min(direct_count, len(friend_pairs))} direct, {group_count} group)"
    )
    return chats, members_map


def seed_chat_messages(
    chats: list[Chat],
    members_map: dict[int, list[BaseUser]],
    messages_per_chat: int,
) -> list[tuple[Publication, Chat, BaseUser]]:
    if not chats:
        return []

    chat_ct = ContentType.objects.get_for_model(Chat)
    result: list[tuple[Publication, Chat, BaseUser]] = []

    for chat in chats:
        members = members_map.get(chat.pk, [])
        if not members:
            continue
        for _ in range(messages_per_chat):
            sender = random.choice(members)
            msg = Publication.objects.create(
                author=sender,
                content=fake.sentence(),
                created_for_type=chat_ct,
                created_for_id=chat.pk,
            )
            result.append((msg, chat, sender))

        # set last_read_message for some members
        last_msg = result[-1][0] if result else None
        if last_msg:
            for cm in ChatMember.objects.filter(chat=chat):
                if random.random() < 0.7:
                    cm.last_read_message = last_msg
                    cm.save(update_fields=["last_read_message"])

    print(f"Generated {len(result)} chat messages across {len(chats)} chats")
    return result


def _find_friend_pairs(users: list[BaseUser]) -> list[tuple[BaseUser, BaseUser]]:
    pairs: list[tuple[BaseUser, BaseUser]] = []
    seen: set[frozenset[int]] = set()

    for user in users:
        for friend in user.friends:
            key = frozenset([user.pk, friend.pk])
            if key not in seen:
                pairs.append((user, friend))
                seen.add(key)

    random.shuffle(pairs)
    return pairs
