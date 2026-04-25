import random
from dataclasses import dataclass

from faker import Faker
from users.management.helpers import create_user_with_password
from users.models import BaseUser
from users.models.connections import UserFollow

from streaming.management.seeders.images import ImageProvider

fake = Faker()


@dataclass
class Credentials:
    email: str
    password: str
    role: str


def seed_users(
    user_count: int,
    artist_count: int,
    image_provider: ImageProvider,
) -> tuple[list[BaseUser], list[BaseUser], list[Credentials]]:
    credentials: list[Credentials] = []
    users: list[BaseUser] = []
    artists: list[BaseUser] = []

    for _ in range(user_count):
        user, pwd = create_user_with_password("streaming")
        _enrich_profile(user, image_provider)
        users.append(user)
        credentials.append(Credentials(email=user.email, password=pwd, role="user"))
        print(f"user: {user.email} / {pwd}")

    for _ in range(artist_count):
        artist, pwd = create_user_with_password("artist")
        _enrich_profile(artist, image_provider)
        artists.append(artist)
        credentials.append(Credentials(email=artist.email, password=pwd, role="artist"))
        print(f"artist: {artist.email} / {pwd}")

    return users, artists, credentials


def _enrich_profile(user: BaseUser, image_provider: ImageProvider):
    user.display_name = fake.name()[:50]
    user.bio = fake.paragraph(nb_sentences=3)
    user.avatar = image_provider.get_image(
        width_range=(150, 300), height_range=(150, 300)
    )
    user.save(update_fields=["display_name", "bio", "avatar"])


def seed_follows(
    users: list[BaseUser],
    count: int,
) -> list[UserFollow]:
    if len(users) < 2:
        return []

    follows: list[UserFollow] = []
    seen: set[tuple[int, int]] = set()

    # create some mutual follows so "friends" exist for direct chats
    mutual_pairs = min(count // 2, len(users) // 2)
    shuffled = users.copy()
    random.shuffle(shuffled)
    for i in range(0, mutual_pairs * 2, 2):
        if i + 1 >= len(shuffled):
            break
        a, b = shuffled[i], shuffled[i + 1]
        for from_u, to_u in [(a, b), (b, a)]:
            key = (from_u.pk, to_u.pk)
            if key not in seen:
                follows.append(UserFollow(from_user=from_u, to_user=to_u))
                seen.add(key)

    attempts = 0
    while len(follows) < count and attempts < count * 5:
        attempts += 1
        a, b = random.sample(users, 2)
        key = (a.pk, b.pk)
        if key not in seen:
            follows.append(UserFollow(from_user=a, to_user=b))
            seen.add(key)

    UserFollow.objects.bulk_create(follows, ignore_conflicts=True)
    print(f"Generated {len(follows)} follow relationships")
    return follows
