import os

from django.core.management.base import BaseCommand
from django.db import transaction

from streaming.management.constants import DEFAULT_GENERATED_AUDIO_DIR
from streaming.management.seeders.audio import seed_songs
from streaming.management.seeders.audio_gen import generate_audio_files
from streaming.management.seeders.collections import (
    seed_collections,
    seed_followed_collections,
)
from streaming.management.seeders.images import ImageProvider
from streaming.management.seeders.notifications import seed_notifications
from streaming.management.seeders.social import (
    seed_chat_messages,
    seed_chats,
    seed_publications,
)
from streaming.management.seeders.users import seed_follows, seed_users


class Command(BaseCommand):
    help = "Generate comprehensive sample data for all system entities"

    def add_arguments(self, parser):
        parser.add_argument("--users", type=int, default=20)
        parser.add_argument("--artists", type=int, default=30)
        parser.add_argument("--songs", type=int, default=40)
        parser.add_argument("--playlists", type=int, default=50)
        parser.add_argument("--albums", type=int, default=70)
        parser.add_argument("--follows", type=int, default=15)
        parser.add_argument("--publications", type=int, default=100)
        parser.add_argument("--feed-posts", type=int, default=100)
        parser.add_argument("--direct-chats", type=int, default=3)
        parser.add_argument("--group-chats", type=int, default=1)
        parser.add_argument("--messages-per-chat", type=int, default=50)
        parser.add_argument("--skip-audio", action="store_true")
        parser.add_argument(
            "--generate-audio",
            action="store_true",
            help="Generate audio files with FFmpeg (to samples/generated/)",
        )
        parser.add_argument(
            "--audio-duration-range",
            type=str,
            default="1,60",
            help="Min,max duration in seconds for generated audio",
        )
        parser.add_argument(
            "--workers",
            type=int,
            default=min(4, os.cpu_count() or 4),
            help="Number of parallel workers for audio generation/processing",
        )

    def handle(self, *args, **options):
        image_provider = ImageProvider()

        if options["generate_audio"] and not options["skip_audio"]:
            dur_min, dur_max = (
                int(x) for x in options["audio_duration_range"].split(",")
            )

            self.stdout.write(f"\nGenerating {options['songs']} audio files")
            generate_audio_files(
                count=options["songs"],
                output_dir=DEFAULT_GENERATED_AUDIO_DIR,
                duration_range=(dur_min, dur_max),
                workers=options["workers"],
            )

        with transaction.atomic():
            self.stdout.write(
                f"\nGenerating {options['users']} users and {options['artists']} artists"
            )
            users, artists, credentials = seed_users(
                user_count=options["users"],
                artist_count=options["artists"],
                image_provider=image_provider,
            )
            all_users = users + artists

            self.stdout.write(f"\nGenerating {options['follows']} follows")
            follows = seed_follows(
                users=all_users,
                count=options["follows"],
            )

            self.stdout.write(f"\nGenerating {options['songs']} songs")
            songs = seed_songs(
                artists=artists,
                song_count=options["songs"],
                image_provider=image_provider,
                skip_audio=options["skip_audio"],
                workers=options["workers"],
            )

            self.stdout.write(
                f"\nGenerating {options['playlists']} playlists and {options['albums']} albums"
            )
            playlists, albums = seed_collections(
                songs=songs,
                users=users,
                artists=artists,
                playlist_count=options["playlists"],
                album_count=options["albums"],
                image_provider=image_provider,
            )

            self.stdout.write("\nGenerating followed collections")
            seed_followed_collections(
                users=all_users,
                collections=playlists + albums,
            )

            self.stdout.write(
                f"\nGenerating {options['publications']} publications and {options['feed_posts']} feed posts"
            )
            publications = seed_publications(
                users=all_users,
                collections=playlists + albums,
                songs=songs,
                pub_count=options["publications"],
                feed_post_count=options["feed_posts"],
            )

            self.stdout.write(
                f"\nGenerating {options['direct_chats']} direct chats and {options['group_chats']} group chats"
            )
            chats, members_map = seed_chats(
                users=all_users,
                direct_count=options["direct_chats"],
                group_count=options["group_chats"],
                image_provider=image_provider,
            )

            self.stdout.write(
                f"\nGenerating {options['messages_per_chat']} messages per chat"
            )
            chat_messages = seed_chat_messages(
                chats=chats,
                members_map=members_map,
                messages_per_chat=options["messages_per_chat"],
            )

            self.stdout.write("\nGenerating notifications")
            seed_notifications(
                follows=follows,
                publications=publications,
                chat_messages=chat_messages,
                chat_members_map=members_map,
            )

        self.stdout.write("")
