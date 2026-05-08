from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("streaming", "0015_collection_draft"),
    ]

    operations = [
        migrations.RenameField(
            model_name="streamingprofile",
            old_name="followed_collections",
            new_name="liked_collections",
        ),
    ]
