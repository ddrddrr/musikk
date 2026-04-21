import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("streaming", "0009_migrate_queue_to_player"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="songqueue",
            name="current_collection_song",
        ),
        migrations.RemoveField(
            model_name="songqueue",
            name="context_collection",
        ),
        migrations.RemoveField(
            model_name="songqueue",
            name="context_cursor",
        ),
        migrations.RemoveField(
            model_name="songqueue",
            name="context_skip_indices",
        ),
        migrations.RemoveField(
            model_name="songqueue",
            name="history_cursor",
        ),
        migrations.RemoveField(
            model_name="streamingprofile",
            name="song_queue",
        ),
        migrations.AlterField(
            model_name="streamingprofile",
            name="player",
            field=models.OneToOneField(
                on_delete=django.db.models.deletion.PROTECT,
                to="streaming.playerstate",
            ),
        ),
        migrations.AlterField(
            model_name="queueitem",
            name="origin",
            field=models.CharField(
                choices=[("source", "Source"), ("user", "User")],
                default="source",
                max_length=16,
            ),
        ),
    ]
