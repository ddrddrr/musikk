from django.db import migrations


def set_site(apps, schema_editor):
    Site = apps.get_model("sites", "Site")
    Site.objects.update_or_create(
        id=1,
        defaults={
            "domain": "musikk.stream",
            "name": "Musikk",
        },
    )


class Migration(migrations.Migration):

    dependencies = [
        ("base", "0001_enable_trgm"),
        ("sites", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(set_site),
    ]
