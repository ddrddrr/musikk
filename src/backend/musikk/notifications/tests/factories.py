from base.tests.factories import BaseModelFactory
from factory import SelfAttribute, SubFactory
from social.api.v1.tests.factories import ChatFactory, PublicationFactory
from users.tests.factories import BaseUserFactory

from notifications.models import (
    ChatMessageNotification,
    FollowerNotification,
    ReplyNotification,
)


class ReplyNotificationFactory(BaseModelFactory):
    class Meta:
        model = ReplyNotification

    orig_publication = SubFactory(PublicationFactory)
    reply_publication = SubFactory(
        PublicationFactory,
        parent=SelfAttribute("..orig_publication"),
        created_for_object=None,
    )


class FollowerNotificationFactory(BaseModelFactory):
    class Meta:
        model = FollowerNotification

    sender = SubFactory(BaseUserFactory)
    receiver = SubFactory(BaseUserFactory)


class ChatMessageNotificationFactory(BaseModelFactory):
    class Meta:
        model = ChatMessageNotification

    chat = SubFactory(ChatFactory)
    message = SubFactory(PublicationFactory, created_for_object=SelfAttribute("..chat"))
    receiver = SubFactory(BaseUserFactory)
