from unittest.mock import patch

from django.test import TestCase
from users.tests.factories import BaseUserFactory
from websockets.event_helpers import user_group

from notifications.models import NotificationProfile
from notifications.tests.factories import (
    ChatMessageNotificationFactory,
    FollowerNotificationFactory,
    ReplyNotificationFactory,
)
from notifications.ws import ServerEvent


@patch("notifications.models.send_ws_event")
class TestNotificationManagers(TestCase):
    def test_create_tells_the_receiver_that_notifications_changed(
        self, send_ws_event_mock
    ):
        receiver = BaseUserFactory()
        cases = [
            (ReplyNotificationFactory, {"orig_publication__author": receiver}),
            (FollowerNotificationFactory, {"receiver": receiver}),
            (ChatMessageNotificationFactory, {"receiver": receiver}),
        ]

        for notification_factory, kwargs in cases:
            with self.subTest(factory=notification_factory.__name__):
                send_ws_event_mock.reset_mock()

                notification_factory(**kwargs)

                send_ws_event_mock.assert_called_once_with(
                    user_group(receiver.uuid), ServerEvent.NOTIFICATIONS_CHANGED
                )


class TestNotificationProfileSignal(TestCase):
    def test_new_user_gets_a_profile_with_nothing_read(self):
        user = BaseUserFactory()

        profile = NotificationProfile.objects.get(user=user)

        self.assertIsNone(profile.read_at)
