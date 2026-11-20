from collections.abc import Sequence
from functools import partial

from django.core.mail import EmailMessage
from django.core.mail.backends.base import BaseEmailBackend
from django.db import transaction

from base.tasks import EmailPayload, send_email


class CeleryEmailBackend(BaseEmailBackend):
    """
    Makes email be processed by the celery worker.
    """

    def send_messages(self, email_messages: Sequence[EmailMessage]) -> int:
        payloads = [self._message_to_payload(message) for message in email_messages]
        for payload in payloads:
            transaction.on_commit(partial(send_email.delay, payload))
        return len(payloads)

    def _message_to_payload(self, message: EmailMessage) -> EmailPayload:
        return EmailPayload(
            subject=message.subject,
            body=message.body,
            from_email=message.from_email,
            to=message.to,
            cc=message.cc,
            bcc=message.bcc,
            reply_to=message.reply_to,
            headers=message.extra_headers,
            alternatives=[
                (alternative.content, alternative.mimetype)
                for alternative in getattr(message, "alternatives", [])
            ],
            content_subtype=message.content_subtype,
        )
