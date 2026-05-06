from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        (
            "streaming",
            "0014_alter_playerstate_context_alter_playerstate_queue_and_more",
        ),
    ]

    operations = [
        migrations.AddField(
            model_name="collection",
            name="draft",
            field=models.BooleanField(db_index=True, default=False),
        ),
    ]
