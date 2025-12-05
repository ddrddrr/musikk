import factory
from factory import SubFactory

from base.tests.factories import BaseModelFactory
from users.models import BaseUser, Artist

fake = factory.Faker


class BaseUserFactory(BaseModelFactory):
    class Meta:
        model = BaseUser

    email = fake("ascii_email")
    is_staff = fake("boolean")


class ArtistFactory(BaseModelFactory):
    class Meta:
        model = Artist

    user = SubFactory(BaseUserFactory)
