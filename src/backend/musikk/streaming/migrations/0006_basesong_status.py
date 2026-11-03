from django.db import migrations, models


def draft_to_status(apps, schema_editor):
    """
    `status` starts as `ready` for every row, which matches `draft=False`.
    A song that is still a draft now is a leftover of an upload that never
    finished, so it becomes `failed`.
    """
    BaseSong = apps.get_model("streaming", "BaseSong")
    BaseSong.objects.filter(draft=True).update(status="failed")


def status_to_draft(apps, schema_editor):
    BaseSong = apps.get_model("streaming", "BaseSong")
    BaseSong.objects.exclude(status="ready").update(draft=True)


class Migration(migrations.Migration):
    dependencies = [
        ("streaming", "0005_remove_collectioncursor_skip_indices"),
    ]

    operations = [
        migrations.AddField(
            model_name="basesong",
            name="status",
            field=models.CharField(
                choices=[
                    ("queued", "Queued"),
                    ("processing", "Processing"),
                    ("ready", "Ready"),
                    ("failed", "Failed"),
                ],
                default="ready",
                max_length=16,
            ),
        ),
        migrations.AddField(
            model_name="basesong",
            name="status_detail",
            field=models.TextField(blank=True, default=""),
        ),
        migrations.RunPython(draft_to_status, status_to_draft),
        migrations.RemoveField(
            model_name="basesong",
            name="draft",
        ),
    ]
