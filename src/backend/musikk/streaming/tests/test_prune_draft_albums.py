from datetime import timedelta
from io import StringIO

from django.core.management import call_command
from django.test import TestCase
from django.utils import timezone

from streaming.models import BaseSong, Collection
from streaming.models.collections import CollectionType
from streaming.tests.factories import BaseSongFactory, CollectionFactory


class TestPruneDraftAlbums(TestCase):
    def _draft_album(self, age_days, songs_count=2):
        album = CollectionFactory(
            type="album",
            draft=True,
            songs=[BaseSongFactory() for _ in range(songs_count)],
        )
        Collection.objects.filter(pk=album.pk).update(
            date_added=timezone.now() - timedelta(days=age_days)
        )
        album.refresh_from_db()
        return album

    def test_deletes_only_old_drafts_and_cascades_songs(self):
        old_draft = self._draft_album(age_days=10)
        recent_draft = self._draft_album(age_days=2)
        published = CollectionFactory(type="album", draft=False, songs=[])
        playlist = CollectionFactory(type="playlist", draft=False, songs=[])

        old_song_uuids = list(
            BaseSong.objects.filter(collectionsongs__collection=old_draft)
            .values_list("uuid", flat=True)
            .distinct()
        )

        out = StringIO()
        call_command("prune_draft_albums", "--older-than-days", "7", stdout=out)

        self.assertFalse(Collection.objects.filter(pk=old_draft.pk).exists())
        self.assertTrue(Collection.objects.filter(pk=recent_draft.pk).exists())
        self.assertTrue(Collection.objects.filter(pk=published.pk).exists())
        self.assertTrue(Collection.objects.filter(pk=playlist.pk).exists())
        self.assertFalse(BaseSong.objects.filter(uuid__in=old_song_uuids).exists())

    def test_skips_published_albums_regardless_of_age(self):
        published = CollectionFactory(type="album", draft=False, songs=[])
        Collection.objects.filter(pk=published.pk).update(
            date_added=timezone.now() - timedelta(days=365)
        )

        call_command("prune_draft_albums", "--older-than-days", "7")

        self.assertTrue(Collection.objects.filter(pk=published.pk).exists())

    def test_skips_draft_playlists(self):
        # type=playlist + draft=True shouldn't normally exist (the create
        # serializer never sets it), but if a row got into that state
        # somehow, prune still scopes to ALBUM and leaves it alone.
        playlist = CollectionFactory(type=CollectionType.PLAYLIST, draft=True, songs=[])
        Collection.objects.filter(pk=playlist.pk).update(
            date_added=timezone.now() - timedelta(days=30)
        )

        call_command("prune_draft_albums", "--older-than-days", "7")

        self.assertTrue(Collection.objects.filter(pk=playlist.pk).exists())
