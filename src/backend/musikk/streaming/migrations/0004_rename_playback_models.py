from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("streaming", "0003_player_state_playback_fields"),
    ]

    operations = [
        migrations.RenameModel(old_name="PlayerState", new_name="StoredPlaybackState"),
        migrations.RenameModel(old_name="PlaybackContext", new_name="CollectionCursor"),
        migrations.RenameModel(old_name="SongQueue", new_name="PlaybackQueue"),
        migrations.RenameField(
            model_name="streamingprofile",
            old_name="player",
            new_name="stored_playback_state",
        ),
        migrations.RenameField(
            model_name="storedplaybackstate",
            old_name="queue",
            new_name="playback_queue",
        ),
        migrations.RenameField(
            model_name="storedplaybackstate",
            old_name="context",
            new_name="collection_cursor",
        ),
    ]
