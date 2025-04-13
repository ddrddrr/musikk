import os.path
import random

from django.core.management.base import BaseCommand
from django.core.files import File
from django.db import transaction

from faker import Faker

from audio_processing.ffmpeg_wrapper import Full
from streaming.models import BaseSong, SongCollection

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
        parser.add_argument(
            "--songs",
            type=int,
            default=2,
            help="Number of songs to generate (default: 2)",
        )
        parser.add_argument(
            "--collections",
            type=int,
            default=1,
            help="Number of song collections to generate (default: 1)",
        )

    def handle(self, *args, **options):
        song_count = options["songs"]
        collection_count = options["collections"]

        with transaction.atomic():
            songs = []
            for _ in range(song_count):
                random_image = get_random_file_path(SAMPLES_PATH, [".jpg", ".png"])
                random_audio = get_random_file_path(SAMPLES_PATH, [".wav"])

                with open(random_image, "rb") as i:
                    song = BaseSong.objects.create(
                        title=fake.file_name(),
                        description=fake.text(max_nb_chars=512),
                        image=File(i, name=os.path.basename(random_image)),
                        like_count=fake.pyint(0, 10000),
                        dislike_count=fake.pyint(0, 10000),
                    )
                    with open(random_audio, "rb") as m:
                        print("converting", random_audio)
                        res = Full.convert_song(m)
                        song.mpd = res.manifests["mpd_path"]
                        song.uuid = res.uuid_
                        song.save()
                    songs.append(song)

            for _ in range(collection_count):
                if not songs:
                    break

                random_image = get_random_file_path(SAMPLES_PATH, [".jpg", ".png"])
                with open(random_image, "rb") as i:
                    collection = SongCollection.objects.create(
                        title=fake.file_name(),
                        description=fake.text(max_nb_chars=512),
                        image=File(i, name=os.path.basename(random_image)),
                    )
                    s = random.choices(songs, k=random.randint(1, len(songs)))
                    collection.songs.add(*s)
                    collection.save()
