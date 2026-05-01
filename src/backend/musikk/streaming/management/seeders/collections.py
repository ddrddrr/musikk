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
    playlist_song_groups = [
        random.sample(songs, k=random.randint(1, len(songs))) if songs else []
        for _ in range(playlist_count)
    ]
    playlists = _create_collections(
        song_groups=playlist_song_groups,
        authors=users,
        collection_type=CollectionType.PLAYLIST,
        image_provider=image_provider,
        label="playlist",
    )
    albums = _create_collections(
        song_groups=_partition_songs(songs, album_count),
        authors=artists,
        collection_type=CollectionType.ALBUM,
        image_provider=image_provider,
        label="album",
    )
    return playlists, albums


def _partition_songs(songs: list[BaseSong], album_count: int) -> list[list[BaseSong]]:
    if not songs or album_count <= 0:
        return []

    effective_count = min(album_count, len(songs))
    shuffled = random.sample(songs, len(songs))
    cut_points = sorted(random.sample(range(1, len(shuffled)), effective_count - 1))

    groups: list[list[BaseSong]] = []
    prev = 0
    for cut in cut_points:
        groups.append(shuffled[prev:cut])
        prev = cut
    groups.append(shuffled[prev:])
    return groups


def _create_collections(
    song_groups: list[list[BaseSong]],
    authors: list[BaseUser],
    collection_type: str,
    image_provider: ImageProvider,
    label: str,
) -> list[Collection]:
    collections: list[Collection] = []
    for chosen in song_groups:
        if not chosen:
            continue

        collection = Collection.objects.create(
            title=fake.bs().title(),
            description=fake.text(max_nb_chars=512),
            image=image_provider.get_image(),
            type=collection_type,
        )

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
