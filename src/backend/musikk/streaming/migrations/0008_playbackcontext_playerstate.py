import uuid

import django.contrib.postgres.fields
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("streaming", "0007_rename_song_queueitem_collection_song_and_more"),
    ]

    operations = [
        migrations.CreateModel(
            name="PlaybackContext",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "uuid",
                    models.UUIDField(
                        db_index=True, default=uuid.uuid7, editable=False, unique=True
                    ),
                ),
                ("date_added", models.DateTimeField(auto_now_add=True)),
                ("date_modified", models.DateTimeField(auto_now=True)),
                ("cursor", models.IntegerField(default=-1)),
                (
                    "skip_indices",
                    django.contrib.postgres.fields.ArrayField(
                        base_field=models.IntegerField(),
                        blank=True,
                        default=list,
                        size=None,
                    ),
                ),
                (
                    "collection",
                    models.ForeignKey(
                        default=None,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="+",
                        to="streaming.collection",
                    ),
                ),
            ],
            options={
                "abstract": False,
            },
        ),
        migrations.CreateModel(
            name="PlayerState",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "uuid",
                    models.UUIDField(
                        db_index=True, default=uuid.uuid7, editable=False, unique=True
                    ),
                ),
                ("date_added", models.DateTimeField(auto_now_add=True)),
                ("date_modified", models.DateTimeField(auto_now=True)),
                ("history_cursor", models.PositiveIntegerField(default=0)),
                (
                    "current_collection_song",
                    models.ForeignKey(
                        default=None,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="+",
                        to="streaming.collectionsong",
                    ),
                ),
                (
                    "queue",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.PROTECT,
                        to="streaming.songqueue",
                    ),
                ),
                (
                    "context",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.PROTECT,
                        to="streaming.playbackcontext",
                    ),
                ),
            ],
            options={
                "abstract": False,
            },
        ),
        migrations.AddField(
            model_name="streamingprofile",
            name="player",
            field=models.OneToOneField(
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                to="streaming.playerstate",
            ),
        ),
    ]
