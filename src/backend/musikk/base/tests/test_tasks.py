from datetime import timedelta

from django.contrib.sessions.models import Session
from django.test import TestCase
from django.utils import timezone

from base.tasks import clear_expired_sessions


class ClearExpiredSessionsTest(TestCase):
    def test_only_expired_sessions_are_deleted(self):
        now = timezone.now()
        Session.objects.create(
            session_key="expired",
            session_data="",
            expire_date=now - timedelta(days=1),
        )
        Session.objects.create(
            session_key="active",
            session_data="",
            expire_date=now + timedelta(days=1),
        )

        clear_expired_sessions()

        self.assertEqual(
            list(Session.objects.values_list("session_key", flat=True)), ["active"]
        )
