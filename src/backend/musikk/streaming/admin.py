from pathlib import Path
import tempfile

from django.contrib import admin
from django import forms

from utils.storage import delete_django_storage_dir
from streaming.audio.processing_pipeline import AudioProcessingPipeline
from streaming.audio.shaka_packager_conf.shaka_packager_wrapper import ManifestType
from streaming.models.collections import Collection
from streaming.models.songs import BaseSong, CollectionSong


class BaseSongAdminForm(forms.ModelForm):
    file = forms.FileField(required=False)

    def clean_file(self):
        uploaded_file = self.cleaned_data.get("file")
        if not uploaded_file:
            return None

        # Delete old content if updating an existing song
        if self.instance.pk and self.instance.content_path:
            delete_django_storage_dir(self.instance.content_path)

        # Save uploaded file to temporary location
        with tempfile.NamedTemporaryFile(
            delete=False, suffix=Path(uploaded_file.name).suffix
        ) as tmp_file:
            for chunk in uploaded_file.chunks():
                tmp_file.write(chunk)
            tmp_file_path = tmp_file.name

        try:
            # Generate storage directory path using the instance's UUID
            storage_dir = f"audio/{self.instance.uuid}"

            # Run the audio processing pipeline
            result = AudioProcessingPipeline.run(
                source=tmp_file_path, final_storage_dir=storage_dir
            )

            return result.song_repr
        finally:
            # Clean up temporary file
            Path(tmp_file_path).unlink(missing_ok=True)


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
            obj.content_path = str(song_repr.content_path)
            obj.mpd = song_repr.manifests[ManifestType.MPD]
            obj.m3u8 = song_repr.manifests[ManifestType.M3U8]
        super().save_model(request, obj, form, change)


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
