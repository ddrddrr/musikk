from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("streaming", "0010_remove_old_queue_fields"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="queueitem",
            name="origin",
        ),
    ]
