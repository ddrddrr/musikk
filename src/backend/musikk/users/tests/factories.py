import factory
from users.models import BaseUser
from users.users_extended import StreamingUser, Artist

fake = factory.Faker


class BaseUserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = BaseUser

    email = fake("ascii_email")
    display_name = fake("user_name")
    avatar = None
    is_admin = fake("boolean")


class StreamingUserFactory(BaseUserFactory):
    class Meta:
        model = StreamingUser


class ArtistFactory(StreamingUserFactory):
    class Meta:
        model = Artist
