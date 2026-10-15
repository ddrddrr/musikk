from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("streaming", "0002_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="playerstate",
            name="curr_play_item_unique_id",
            field=models.UUIDField(default=None, null=True),
        ),
        migrations.AddField(
            model_name="playerstate",
            name="last_known_is_playing",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="playerstate",
            name="last_known_song_pos_ms",
            field=models.PositiveBigIntegerField(default=0),
        ),
        migrations.AddField(
            model_name="playerstate",
            name="last_known_song_pos_updated_at_server_ms",
            field=models.PositiveBigIntegerField(default=0),
        ),
    ]
