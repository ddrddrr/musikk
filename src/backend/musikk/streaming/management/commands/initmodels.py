import os
import random

from django.core.management.base import BaseCommand
from django.core.files import File
from django.db import transaction

from faker import Faker

from users.management.helpers import create_user_with_password
from streaming.models import BaseSong, SongCollection, SongCollectionAuthor
from streaming.songs import SongAuthor, SongCollectionSong
from audio_processing.ffmpeg_wrapper import Full

fake = Faker()
SAMPLES_PATH = os.path.expanduser("~/studies/musikk/samples")


def get_random_file_path(directory, extensions=None) -> str:
    files = [
        f
        for f in os.listdir(directory)
        if os.path.isfile(os.path.join(directory, f))
        and (not extensions or os.path.splitext(f)[-1].lower() in extensions)
    ]
    return os.path.join(directory, random.choice(files))


class Command(BaseCommand):
    def add_arguments(self, parser):
        parser.add_argument("--users", type=int, default=2)
        parser.add_argument("--artists", type=int, default=5)
        parser.add_argument("--songs", type=int, default=15)
        parser.add_argument("--collections", type=int, default=5)

    def handle(self, *args, **options):
        users_count = options["users"]
        artists_count = options["artists"]
        song_count = options["songs"]
        collection_count = options["collections"]

        with transaction.atomic():
            users = []
            artists = []

            print("\nCreating streaming users:")
            for _ in range(users_count):
                user, password = create_user_with_password("streaming")
                users.append((user, password))
                print(f"- {user.email} / {password}")

            print("\nCreating artists:")
            for _ in range(artists_count):
                artist, password = create_user_with_password("artist")
                artists.append((artist, password))
                print(f"- {artist.email} / {password}")

            user_objs = [u[0] for u in users]
            artist_objs = [a[0] for a in artists]

            print(f"\nCreated {len(user_objs)} users and {len(artist_objs)} artists\n")

            songs = []
            for _ in range(song_count):
                random_image = get_random_file_path(SAMPLES_PATH, [".jpg", ".png"])
                random_audio = get_random_file_path(SAMPLES_PATH, [".wav"])

                with open(random_image, "rb") as i, open(random_audio, "rb") as m:
                    song = BaseSong.objects.create(
                        title=fake.catch_phrase(),
                        description=fake.text(max_nb_chars=512),
                        image=File(i, name=os.path.basename(random_image)),
                        like_count=fake.pyint(0, 10000),
                        dislike_count=fake.pyint(0, 10000),
                    )
                    print(f"Converting audio for song '{song.title}'")
                    res = Full.convert_song(m)
                    song.mpd = res.manifests["mpd_path"]
                    song.uuid = res.uuid_
                    song.save()

                    song_authors = random.sample(
                        artist_objs, k=random.randint(1, min(3, len(artist_objs)))
                    )
                    for priority, artist in enumerate(song_authors):
                        SongAuthor.objects.create(
                            song=song, author=artist, author_priority=priority
                        )
                        artist.owned_songs.add(song)
                    print(
                        f"Created song '{song.title}' with authors {[a.email for a in song_authors]}"
                    )
                    songs.append(song)

            collection_types = [
                SongCollection.CollectionType.PLAYLIST,
                SongCollection.CollectionType.ALBUM,
            ]

            for _ in range(collection_count):
                if not songs:
                    break
                random_image = get_random_file_path(SAMPLES_PATH, [".jpg", ".png"])
                with open(random_image, "rb") as i:
                    collection_type = random.choice(collection_types)
                    collection = SongCollection.objects.create(
                        title=fake.bs().title(),
                        description=fake.text(max_nb_chars=512),
                        image=File(i, name=os.path.basename(random_image)),
                        type=collection_type,
                    )
                    selected_songs = random.sample(
                        songs, k=random.randint(1, len(songs))
                    )
                    for idx, song in enumerate(selected_songs):
                        SongCollectionSong.objects.create(
                            song=song, song_collection=collection, position=idx
                        )

                    authors = random.sample(
                        artist_objs, k=random.randint(1, len(artist_objs))
                    )
                    for priority, author in enumerate(authors):
                        SongCollectionAuthor.objects.create(
                            song_collection=collection,
                            author=author,
                            author_priority=priority,
                        )
                        author.owned_song_collections.add(collection)
                    print(
                        f"Created {collection.type} '{collection.title}' with {len(selected_songs)} songs and authors {[a.email for a in authors]}"
                    )
