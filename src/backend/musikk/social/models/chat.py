from base.models import BaseModel
from django.db import models
from utils.paths import deafult_image_path


class Chat(BaseModel):
    title = models.CharField(max_length=200, blank=True, default="")
    image = models.ImageField(upload_to=deafult_image_path, null=True, blank=True)
    is_direct = models.BooleanField(
        default=True,
        help_text="Indicates, whether the Chat is between two people only.",
    )


class ChatMember(BaseModel):
    chat = models.ForeignKey(Chat, on_delete=models.CASCADE)
    member = models.ForeignKey("users.BaseUser", on_delete=models.CASCADE)
    last_read_message = models.ForeignKey(
        "social.Publication", null=True, blank=True, on_delete=models.SET_NULL
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["chat", "member"], name="unique_chat_member"
            ),
        ]


# in serializer for chat return last message
# if last_read_message == last message id -> read, else unread
