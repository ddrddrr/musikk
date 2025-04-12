from pathlib import Path

from django.contrib import admin
from django import forms

from audio_processing.ffmpeg_wrapper import FFMPEGWrapper
from audio_processing.converters import FLAC_CONVERTER
from musikk.utils import delete_dir_for_file
from streaming.song_collections import SongCollection
from streaming.songs import BaseSong, SongCollectionSong


class BaseSongAdminForm(forms.ModelForm):
    file = forms.FileField(required=False)

    def clean_file(self):
        uploaded_file = self.cleaned_data.get("file")
        if uploaded_file:
            if self.instance.mpd:
                delete_dir_for_file(Path(self.instance.mpd))
            ffmpeg = FFMPEGWrapper().add_converter(FLAC_CONVERTER)
            song_repr = ffmpeg.convert_song(uploaded_file.file)
            return song_repr

        return None


@admin.register(BaseSong)
class BaseSongAdmin(admin.ModelAdmin):
    change_form_template = "admin/streaming/song_admin.html"
    form = BaseSongAdminForm

    fields = [
        "file",
        "title",
        "content_path",
        "mpd",
        "description",
        "image",
    ]
    # readonly_fields = ["mpd"]

    def save_model(self, request, obj, form, change):
        if song_repr := form.cleaned_data.get("file"):
            obj.mpd = song_repr.manifests["mpd_path"]
            obj.content_path = song_repr.content_path
            obj.uuid = song_repr.uuid_
        super().save_model(request, obj, form, change)


class SongCollectionSongInline(admin.StackedInline):
    model = SongCollectionSong
    ordering = ["position"]


@admin.register(SongCollection)
class SongCollectionAdmin(admin.ModelAdmin):
    inlines = [SongCollectionSongInline]

    fields = [
        "title",
        "description",
        "image",
        "metadata",
    ]
