import os
import uuid
import tempfile
import io
import random
import requests

from django.conf import settings
from django.core.files import File
from django.core.management.base import BaseCommand
from django.db import transaction

from faker import Faker

from streaming.audio.shaka_packager_conf.shaka_packager_wrapper import ManifestType
from streaming.audio.processing_pipeline import AudioProcessingPipeline
from streaming.models.collections import CollectionType
from users.management.helpers import create_user_with_password
from streaming.models import (
    BaseSong,
    Collection,
    CollectionSong,
    SongCredit,
    CollectionCredit,
)

fake = Faker()

AUDIO_LOCAL_FILE = str(
    settings.BASE_DIR / "streaming" / "audio" / "tests" / "data" / "file1.wav"
)

IMAGE_URL_1 = "https://picsum.photos/500"
IMAGE_URL_2 = "https://picsum.photos/200"


class Command(BaseCommand):
    help = "Create sample users, artists, songs, collections, and albums"

    def add_arguments(self, parser):
        parser.add_argument("--users", type=int, default=2)
        parser.add_argument("--artists", type=int, default=3)
        parser.add_argument("--songs", type=int, default=7)
        parser.add_argument("--collections", type=int, default=2)
        parser.add_argument("--albums", type=int, default=2)

    def handle(self, *args, **options):
        users_count = options["users"]
        artists_count = options["artists"]
        songs_count = options["songs"]
        collections_count = options["collections"]
        albums_count = options["albums"]

        image_urls = [IMAGE_URL_1, IMAGE_URL_2]

        with transaction.atomic():
            users = self._create_users(users_count)
            artists = self._create_artists(artists_count)

            self.stdout.write(
                f"\nCreated {len(users)} users and {len(artists)} artists.\n"
            )

            songs = []
            for _ in range(songs_count):
                image_url = random.choice(image_urls)

                song = self._create_song(
                    audio_path=AUDIO_LOCAL_FILE, image_url=image_url, artists=artists
                )
                songs.append(song)

            self._create_playlists(
                songs=songs,
                image_urls=image_urls,
                collections_count=collections_count,
                users=users,
            )

            self._create_albums(
                songs=songs,
                image_urls=image_urls,
                albums_count=albums_count,
                artists=artists,
            )

    def _create_users(self, count):
        created = []
        for _ in range(count):
            user, pwd = create_user_with_password("streaming")
            created.append(user)
            self.stdout.write(f"- user: {user.email} / {pwd}")
        return created

    def _create_artists(self, count):
        created = []
        for _ in range(count):
            artist, pwd = create_user_with_password("artist")
            artist.is_staff = True
            artist.is_superuser = True
            artist.save()
            created.append(artist)
            self.stdout.write(f"- artist: {artist.email} / {pwd}")
        return created

    def _create_song(self, audio_path: str, image_url: str, artists: list):
        image_file = self._fetch_image_file(image_url)
        song = BaseSong.objects.create(
            title=fake.catch_phrase(),
            description=fake.text(max_nb_chars=512),
            image=image_file,
        )

        tmp_audio_path = self._get_local_temp_audio(audio_path)
        audio_uuid = str(uuid.uuid4())
        storage_dir = os.path.join(settings.AUDIO_CONTENT_PATH, audio_uuid)

        try:
            self.stdout.write(f"Converting audio for '{song.title}'…")
            self._process_audio_for_song(song, tmp_audio_path, audio_uuid, storage_dir)
        except Exception as exc:
            self.stderr.write(f"Failed processing audio for '{song.title}': {exc}")
        finally:
            self._safe_remove(tmp_audio_path)

        self._create_song_credits(song, artists)

        self.stdout.write(
            f"Created '{song.title}' ({len(song.credits.all())} author(s))"
        )
        return song

    def _fetch_image_file(self, url: str) -> File:
        resp = requests.get(url)
        return File(io.BytesIO(resp.content), name=os.path.basename(url))

    def _get_local_temp_audio(self, path: str) -> str:
        """
        Copy a local audio file to a temporary file and return its path.
        Expects `path` to be an existing filesystem path.
        """
        if not os.path.exists(path):
            raise FileNotFoundError(f"Local audio file not found: {path}")
        suffix = os.path.splitext(path)[1] or ".wav"
        with open(path, "rb") as rf:
            with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tf:
                tf.write(rf.read())
                return tf.name

    def _process_audio_for_song(
        self, song: BaseSong, tmp_audio_path: str, audio_uuid: str, storage_dir: str
    ) -> bool:
        result = AudioProcessingPipeline.run(
            source=tmp_audio_path, final_storage_dir=storage_dir
        )

        song.content_path = storage_dir
        song.mpd = result.song_repr.manifests.get(ManifestType.MPD)
        song.m3u8 = result.song_repr.manifests.get(ManifestType.M3U8)
        song.save()
        return True

    def _create_song_credits(self, song: BaseSong, artists: list):
        if not artists:
            return
        num_authors = random.randint(1, min(3, len(artists)))
        for priority, author in enumerate(random.sample(artists, num_authors)):
            SongCredit.objects.create(
                song=song, author=author, author_priority=priority
            )

    def _create_playlists(
        self, songs: list, image_urls: list, collections_count: int, users: list
    ):
        for _ in range(collections_count):
            if not songs:
                break

            image_file = self._fetch_image_file(random.choice(image_urls))
            collection = Collection.objects.create(
                title=fake.bs().title(),
                description=fake.text(max_nb_chars=512),
                image=image_file,
            )

            chosen = random.sample(songs, k=random.randint(1, len(songs)))
            for idx, song in enumerate(chosen):
                CollectionSong.objects.create(
                    collection=collection, song=song, position=idx
                )

            num_creds = random.randint(1, len(users)) if users else 0
            for priority, author in enumerate(
                random.sample(users, num_creds) if num_creds else []
            ):
                CollectionCredit.objects.create(
                    collection=collection,
                    author=author,
                    author_priority=priority,
                )

            self.stdout.write(
                f"Created collection '{collection.title}' "
                f"with {len(chosen)} song(s) and {collection.collection_credits.count()} author(s)"
            )

    def _create_albums(
        self, songs: list, image_urls: list, albums_count: int, artists: list
    ):
        for _ in range(albums_count):
            if not songs:
                break

            image_file = self._fetch_image_file(random.choice(image_urls))
            album = Collection.objects.create(
                title=fake.bs().title(),
                description=fake.text(max_nb_chars=512),
                image=image_file,
                type=CollectionType.ALBUM,
            )

            chosen = random.sample(songs, k=random.randint(1, len(songs)))
            for idx, song in enumerate(chosen):
                CollectionSong.objects.create(collection=album, song=song, position=idx)

            num_creds = random.randint(1, len(artists)) if artists else 0
            for priority, author in enumerate(
                random.sample(artists, num_creds) if num_creds else []
            ):
                CollectionCredit.objects.create(
                    collection=album,
                    author=author,
                    author_priority=priority,
                )

            self.stdout.write(
                f"Created album '{album.title}' "
                f"with {len(chosen)} song(s) and {album.collection_credits.count()} author(s)"
            )

    def _safe_remove(self, path: str):
        try:
            if path and os.path.exists(path):
                os.remove(path)
        except Exception:
            self.stderr.write("Failed to remove temporary file %s", path)
