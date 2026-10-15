from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("streaming", "0004_rename_playback_models"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="collectioncursor",
            name="skip_indices",
        ),
    ]
