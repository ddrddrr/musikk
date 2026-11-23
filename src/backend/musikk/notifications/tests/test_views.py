from datetime import timedelta
from unittest.mock import patch
from uuid import uuid4

from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIRequestFactory, force_authenticate
from users.models import BaseUser
from users.tests.factories import BaseUserFactory

from notifications.api.v1.views import (
    NotificationDeleteView,
    NotificationsPersonalListUpdateView,
)
from notifications.models import (
    ChatMessageNotification,
    FollowerNotification,
    ReplyNotification,
)
from notifications.tests.factories import (
    ChatMessageNotificationFactory,
    FollowerNotificationFactory,
    ReplyNotificationFactory,
)


class NotificationsTestCase(TestCase):
    """
    Gives `me` one notification of each kind, all caused by `other_user`.
    The notification managers send a WebSocket event on create, so the patch
    starts in setUpClass and also covers the notifications made in setUp.
    """

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.factory = APIRequestFactory()
        cls.ws_patcher = patch("notifications.models.send_ws_event")
        cls.ws_patcher.start()

    @classmethod
    def tearDownClass(cls):
        cls.ws_patcher.stop()
        super().tearDownClass()

    def setUp(self):
        self.me = BaseUserFactory()
        self.other_user = BaseUserFactory()
        self.reply = ReplyNotificationFactory(
            orig_publication__author=self.me,
            reply_publication__author=self.other_user,
        )
        self.follower = FollowerNotificationFactory(
            sender=self.other_user, receiver=self.me
        )
        self.chat_message = ChatMessageNotificationFactory(
            message__author=self.other_user, receiver=self.me
        )
        self.my_notifications = [self.reply, self.follower, self.chat_message]


class TestNotificationsPersonalListUpdateView(NotificationsTestCase):
    def _get(self, user=None):
        request = self.factory.get(reverse("api:notifications-list-update"))
        if user is not None:
            force_authenticate(request, user=user)
        return NotificationsPersonalListUpdateView.as_view()(request)

    def _patch(self, user):
        request = self.factory.patch(reverse("api:notifications-list-update"))
        force_authenticate(request, user=user)
        return NotificationsPersonalListUpdateView.as_view()(request)

    @staticmethod
    def _uuids_by_kind(response) -> dict[str, set[str]]:
        uuids = {}
        for kind, items in response.data.items():
            uuids[kind] = {item["uuid"] for item in items}
        return uuids

    @staticmethod
    def _read_states(response) -> dict[str, bool]:
        states = {}
        for items in response.data.values():
            for item in items:
                states[item["uuid"]] = item["is_read"]
        return states

    def test_get_lists_only_the_notifications_of_the_user(self):
        ReplyNotificationFactory(reply_publication__author=self.me)
        FollowerNotificationFactory(sender=self.me, receiver=self.other_user)
        ChatMessageNotificationFactory(
            chat=self.chat_message.chat,
            message__author=self.me,
            receiver=self.other_user,
        )

        response = self._get(self.me)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            self._uuids_by_kind(response),
            {
                "replies": {str(self.reply.uuid)},
                "followers": {str(self.follower.uuid)},
                "chat_messages": {str(self.chat_message.uuid)},
            },
        )

    def test_reply_to_own_publication_is_not_listed(self):
        ReplyNotificationFactory(
            orig_publication=self.reply.orig_publication,
            reply_publication__author=self.me,
        )

        response = self._get(self.me)

        self.assertEqual(
            self._uuids_by_kind(response)["replies"], {str(self.reply.uuid)}
        )

    def test_get_requires_authentication(self):
        response = self._get()

        self.assertEqual(response.status_code, 401)

    def test_notifications_are_unread_before_the_first_patch(self):
        response = self._get(self.me)

        self.assertEqual(
            self._read_states(response),
            {str(n.uuid): False for n in self.my_notifications},
        )

    def test_only_notifications_added_until_read_at_are_read(self):
        read_at = timezone.now()
        profile = self.me.notificationprofile
        profile.read_at = read_at
        profile.save()
        FollowerNotification.objects.filter(pk=self.follower.pk).update(
            date_added=read_at - timedelta(minutes=1)
        )
        ChatMessageNotification.objects.filter(pk=self.chat_message.pk).update(
            date_added=read_at
        )
        ReplyNotification.objects.filter(pk=self.reply.pk).update(
            date_added=read_at + timedelta(minutes=1)
        )

        response = self._get(self.me)

        self.assertEqual(
            self._read_states(response),
            {
                str(self.follower.uuid): True,
                str(self.chat_message.uuid): True,
                str(self.reply.uuid): False,
            },
        )

    def test_patch_marks_every_existing_notification_as_read(self):
        patch_response = self._patch(self.me)
        # A fresh user object, so the GET reads read_at from the database
        # and not from the profile cached on self.me.
        response = self._get(BaseUser.objects.get(pk=self.me.pk))

        self.assertEqual(patch_response.status_code, 204)
        self.assertEqual(
            self._read_states(response),
            {str(n.uuid): True for n in self.my_notifications},
        )


class TestNotificationDeleteView(NotificationsTestCase):
    def _delete(self, notification_uuid, user):
        url = reverse("api:notifications-delete", kwargs={"uuid": notification_uuid})
        request = self.factory.delete(url)
        force_authenticate(request, user=user)
        return NotificationDeleteView.as_view()(request, uuid=notification_uuid)

    def test_receiver_deletes_a_notification_of_each_kind(self):
        for notification in self.my_notifications:
            with self.subTest(kind=type(notification).__name__):
                response = self._delete(notification.uuid, self.me)

                self.assertEqual(response.status_code, 204)
                self.assertFalse(
                    type(notification).objects.filter(pk=notification.pk).exists()
                )

    def test_other_user_cannot_delete_a_notification_of_the_receiver(self):
        for notification in self.my_notifications:
            with self.subTest(kind=type(notification).__name__):
                response = self._delete(notification.uuid, self.other_user)

                self.assertEqual(response.status_code, 404)
                self.assertTrue(
                    type(notification).objects.filter(pk=notification.pk).exists()
                )

    def test_unknown_uuid_returns_404(self):
        response = self._delete(uuid4(), self.me)

        self.assertEqual(response.status_code, 404)
