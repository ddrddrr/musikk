import tempfile
from pathlib import Path

from django.conf import settings
from django.core.management import call_command
from django.test import SimpleTestCase

SCHEMA_PATH = settings.BASE_DIR / "schema.yml"


class CommittedSchemaTest(SimpleTestCase):
    """
    The frontend types are generated from the committed schema. A serializer or
    view change without a new schema would leave those types out of date.
    """

    def test_committed_schema_matches_generated_schema(self):
        with tempfile.TemporaryDirectory() as tmp_dir:
            generated_path = Path(tmp_dir) / "schema.yml"
            call_command(
                "spectacular",
                "--file",
                str(generated_path),
                "--validate",
                "--fail-on-warn",
            )
            generated = generated_path.read_bytes()

        self.assertEqual(
            generated,
            SCHEMA_PATH.read_bytes(),
            "schema.yml is out of date. Run `python manage.py spectacular "
            "--file schema.yml --validate --fail-on-warn`, then `npm run gen:api` "
            "in the frontend.",
        )
