import json
from unittest.mock import patch

from django.core import mail
from django.core.mail import EmailMultiAlternatives
from django.db import transaction
from django.test import TestCase, override_settings

from base.tasks import send_email


@override_settings(
    EMAIL_BACKEND="base.email.CeleryEmailBackend",
    EMAIL_DELIVERY_BACKEND="django.core.mail.backends.locmem.EmailBackend",
)
@patch("base.email.send_email.delay")
class CeleryEmailBackendTest(TestCase):
    def _message(self) -> EmailMultiAlternatives:
        message = EmailMultiAlternatives(
            "Confirm your email",
            "Text body",
            "from@example.com",
            ["to@example.com"],
            headers={"X-Test": "1"},
        )
        message.attach_alternative("<p>HTML body</p>", "text/html")
        return message

    def test_queued_mail_is_sent_by_the_task(self, mock_delay):
        with self.captureOnCommitCallbacks(execute=True):
            self._message().send()
            mock_delay.assert_not_called()

        # Celery sends the payload as JSON
        payload = json.loads(json.dumps(mock_delay.call_args.args[0]))
        send_email(payload)

        [sent] = mail.outbox
        self.assertEqual(sent.subject, "Confirm your email")
        self.assertEqual(sent.body, "Text body")
        self.assertEqual(sent.to, ["to@example.com"])
        self.assertEqual(sent.extra_headers, {"X-Test": "1"})
        self.assertEqual(sent.alternatives, [("<p>HTML body</p>", "text/html")])

    def test_rolled_back_mail_is_not_queued(self, mock_delay):
        with self.captureOnCommitCallbacks(execute=True) as callbacks:
            with self.assertRaises(RuntimeError), transaction.atomic():
                self._message().send()
                raise RuntimeError

        self.assertEqual(callbacks, [])
        mock_delay.assert_not_called()
