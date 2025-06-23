import factory
from factory import SubFactory

from users.models import BaseUser
from users.models.profiles import StreamingProfile, ArtistProfile

fake = factory.Faker


class BaseUserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = BaseUser

    email = fake("ascii_email")
    display_name = fake("user_name")
    avatar = None
    is_admin = fake("boolean")


class BaseProfileFactory(factory.Factory):
    class Meta:
        abstract = True

    display_name = fake("user_name")
    bio = fake("paragraph")
    avatar = None


class StreamingProfileFactory(BaseProfileFactory, factory.django.DjangoModelFactory):
    class Meta:
        model = StreamingProfile

    user = SubFactory(BaseUserFactory)


class ArtistProfileFactory(BaseProfileFactory, factory.django.DjangoModelFactory):
    class Meta:
        model = ArtistProfile

    user = SubFactory(BaseUserFactory)
