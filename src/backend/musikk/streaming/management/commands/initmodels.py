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

from users.management.helpers import create_user_with_password
from streaming.models import (
    BaseSong,
    Collection,
    CollectionSong,
    SongCredit,
    CollectionCredit,
)
from streaming.audio.ffmpeg_conf.ffmpeg_wrapper import FFMPEGFull, ManifestType
from musikk.utils.tests import AUDIO_URL_1, AUDIO_URL_2, IMAGE_URL_1, IMAGE_URL_2
from users.models import StreamingProfile, ArtistProfile

fake = Faker()


class Command(BaseCommand):
    help = "Create sample users, artists, songs and collections"

    def add_arguments(self, parser):
        parser.add_argument("--users", type=int, default=2)
        parser.add_argument("--artists", type=int, default=3)
        parser.add_argument("--songs", type=int, default=7)
        parser.add_argument("--collections", type=int, default=3)

    def handle(self, *args, **options):
        users_count = options["users"]
        artists_count = options["artists"]
        songs_count = options["songs"]
        collections_count = options["collections"]

        audio_urls = [AUDIO_URL_1, AUDIO_URL_2]
        image_urls = [IMAGE_URL_1, IMAGE_URL_2]

        with transaction.atomic():
            # Create streaming users
            users = []
            for _ in range(users_count):
                user, pwd = create_user_with_password("streaming")
                StreamingProfile.objects.for_user(user)
                users.append(user)
                self.stdout.write(f"- user: {user.email} / {pwd}")

            # Create artist accounts
            artists = []
            for _ in range(artists_count):
                artist, pwd = create_user_with_password("artist")
                ArtistProfile.objects.for_user(artist)
                artists.append(artist)
                self.stdout.write(f"- artist: {artist.email} / {pwd}")

            self.stdout.write(
                f"\nCreated {len(users)} users and {len(artists)} artists.\n"
            )

            # Create songs
            songs = []
            for _ in range(songs_count):
                # pick remote fixtures
                audio_url = random.choice(audio_urls)
                image_url = random.choice(image_urls)

                # fetch and wrap image
                img_resp = requests.get(image_url)
                img_file = File(
                    io.BytesIO(img_resp.content),
                    name=os.path.basename(image_url),
                )

                song = BaseSong.objects.create(
                    title=fake.catch_phrase(),
                    description=fake.text(max_nb_chars=512),
                    image=img_file,
                )

                # download to temp WAV
                audio_resp = requests.get(audio_url)
                with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tf:
                    tf.write(audio_resp.content)
                    tmp_audio_path = tf.name

                self.stdout.write(f"Converting audio for '{song.title}'…")
                audio_uuid = str(uuid.uuid4())
                storage_dir = os.path.join(settings.AUDIO_CONTENT_PATH, audio_uuid)

                ret = FFMPEGFull.convert_audio(
                    file_path=tmp_audio_path,
                    storage_dir=storage_dir,
                    out_file_prefix=audio_uuid,
                )

                # assign manifests and uuid
                song.uuid = audio_uuid
                song.mpd = ret.manifests[ManifestType.MPD]
                song.m3u8 = ret.manifests[ManifestType.M3U8]
                song.save()

                os.remove(tmp_audio_path)

                # credits
                num_authors = random.randint(1, min(3, len(artists)))
                for priority, author in enumerate(random.sample(artists, num_authors)):
                    SongCredit.objects.create(
                        song=song, author=author, author_priority=priority
                    )

                self.stdout.write(
                    f"Created '{song.title}' ({len(song.song_credits.all())} author(s))"
                )
                songs.append(song)

            # Create collections (albums/playlists)
            types = [
                Collection.CollectionType.ALBUM,
                Collection.CollectionType.PLAYLIST,
            ]
            for _ in range(collections_count):
                if not songs:
                    break

                image_url = random.choice(image_urls)
                img_resp = requests.get(image_url)
                img_file = File(
                    io.BytesIO(img_resp.content),
                    name=os.path.basename(image_url),
                )

                collection = Collection.objects.create(
                    title=fake.bs().title(),
                    description=fake.text(max_nb_chars=512),
                    image=img_file,
                    type=random.choice(types),
                )

                chosen = random.sample(songs, k=random.randint(1, len(songs)))
                for idx, song in enumerate(chosen):
                    CollectionSong.objects.create(
                        collection=collection, song=song, position=idx
                    )

                num_creds = random.randint(1, len(artists))
                for priority, author in enumerate(random.sample(artists, num_creds)):
                    CollectionCredit.objects.create(
                        collection=collection,
                        author=author,
                        author_priority=priority,
                    )

                self.stdout.write(
                    f"Created {collection.get_type_display()} '{collection.title}' "
                    f"with {len(chosen)} song(s) and {collection.collection_credits.count()} author(s)"
                )
