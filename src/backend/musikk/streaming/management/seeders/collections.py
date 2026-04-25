import random

from faker import Faker
from users.models import BaseUser

from streaming.management.seeders.images import ImageProvider
from streaming.models import (
    BaseSong,
    Collection,
    CollectionCredit,
    CollectionSong,
    StreamingProfile,
)
from streaming.models.collections import CollectionType

fake = Faker()


def seed_collections(
    songs: list[BaseSong],
    users: list[BaseUser],
    artists: list[BaseUser],
    playlist_count: int,
    album_count: int,
    image_provider: ImageProvider,
) -> tuple[list[Collection], list[Collection]]:
    playlists = _create_collections(
        songs=songs,
        authors=users,
        count=playlist_count,
        collection_type=CollectionType.PLAYLIST,
        image_provider=image_provider,
        label="playlist",
    )
    albums = _create_collections(
        songs=songs,
        authors=artists,
        count=album_count,
        collection_type=CollectionType.ALBUM,
        image_provider=image_provider,
        label="album",
    )
    return playlists, albums


def _create_collections(
    songs: list[BaseSong],
    authors: list[BaseUser],
    count: int,
    collection_type: str,
    image_provider: ImageProvider,
    label: str,
) -> list[Collection]:
    collections: list[Collection] = []
    for _ in range(count):
        if not songs:
            break

        collection = Collection.objects.create(
            title=fake.bs().title(),
            description=fake.text(max_nb_chars=512),
            image=image_provider.get_image(),
            type=collection_type,
        )

        chosen = random.sample(songs, k=random.randint(1, len(songs)))
        for idx, song in enumerate(chosen):
            CollectionSong.objects.create(
                collection=collection, song=song, position=idx
            )

        if authors:
            num_creds = random.randint(1, min(3, len(authors)))
            for priority, author in enumerate(random.sample(authors, num_creds)):
                CollectionCredit.objects.create(
                    collection=collection, author=author, author_priority=priority
                )

        collections.append(collection)
        print(
            f"{label} '{collection.title}': "
            f"{len(chosen)} song(s), {collection.collection_credits.count()} author(s)"
        )

    return collections


def seed_followed_collections(
    users: list[BaseUser],
    collections: list[Collection],
):
    if not collections:
        return
    public = [c for c in collections if not c.private]
    if not public:
        return

    total = 0
    for user in users:
        profile = StreamingProfile.objects.get(user=user)
        to_follow = random.sample(public, k=random.randint(1, min(3, len(public))))
        profile.followed_collections.add(*to_follow)
        total += len(to_follow)

    print(f"Generated {total} collection follows across {len(users)} users")
