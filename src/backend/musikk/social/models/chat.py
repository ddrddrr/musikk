from django.db import models

from base.models import BaseModel
from musikk.utils.paths import DEFAULT_IMAGE_PATH


# TODO: guard against multiple chats for the same pair of people when is_direct=True
class Chat(BaseModel):
    title = models.CharField(max_length=2000, blank=True, default="")
    image = models.ImageField(upload_to=DEFAULT_IMAGE_PATH, null=True, blank=True)
    is_direct = models.BooleanField(
        default=True,
        help_text="Indicates, whether the Chat is between two people only.",
    )


class ChatMember(BaseModel):
    chat = models.ForeignKey(Chat, on_delete=models.CASCADE)
    member = models.ForeignKey("users.BaseUser", on_delete=models.CASCADE)
    # TODO: this is probably fine, but check...
    last_read_message = models.ForeignKey(
        "social.Publication", null=True, blank=True, on_delete=models.DO_NOTHING
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["chat", "member"], name="unique_chat_member"
            ),
        ]


# in serializer for chat return last message
# if last_read_message == last message id -> read, else unread
