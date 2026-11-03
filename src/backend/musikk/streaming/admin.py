from django.contrib import admin

from streaming.models.collections import Collection
from streaming.models.songs import BaseSong, CollectionSong


@admin.register(BaseSong)
class BaseSongAdmin(admin.ModelAdmin):
    change_form_template = "admin/streaming/song_admin.html"

    fields = [
        "title",
        "content_path",
        "mpd",
        "description",
        "image",
    ]


class SongCollectionSongInline(admin.StackedInline):
    model = CollectionSong
    ordering = ["position"]


@admin.register(Collection)
class SongCollectionAdmin(admin.ModelAdmin):
    inlines = [SongCollectionSongInline]

    fields = [
        "title",
        "description",
        "image",
        "metadata",
    ]
