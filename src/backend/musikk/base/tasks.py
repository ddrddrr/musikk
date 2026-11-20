from typing import TypedDict

from anymail.exceptions import AnymailAPIError
from celery import shared_task
from django.conf import settings
from django.core.mail import EmailMultiAlternatives, get_connection
from django.core.management import call_command
from django.utils import timezone

from base.media_cleanup import delete_orphan_images


class EmailPayload(TypedDict):
    subject: str
    body: str
    from_email: str
    to: list[str]
    cc: list[str]
    bcc: list[str]
    reply_to: list[str]
    headers: dict[str, str]
    alternatives: list[tuple[str, str]]
    content_subtype: str


@shared_task(
    autoretry_for=(AnymailAPIError,),
    retry_backoff=10,  # s
    max_retries=5,
    soft_time_limit=30,  # s
    time_limit=60,  # s
)
def send_email(payload: EmailPayload) -> None:
    message = EmailMultiAlternatives(
        subject=payload["subject"],
        body=payload["body"],
        from_email=payload["from_email"],
        to=payload["to"],
        cc=payload["cc"],
        bcc=payload["bcc"],
        reply_to=payload["reply_to"],
        headers=payload["headers"],
        alternatives=payload["alternatives"],
    )
    message.content_subtype = payload["content_subtype"]
    get_connection(settings.EMAIL_DELIVERY_BACKEND).send_messages([message])


@shared_task
def clear_expired_sessions() -> None:
    call_command("clearsessions")


@shared_task
def cleanup_orphan_images() -> None:
    delete_orphan_images(timezone.now())
