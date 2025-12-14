import factory

from base.tests.factories import BaseModelFactory
from users.models import BaseUser, UserRole

fake = factory.Faker


class BaseUserFactory(BaseModelFactory):
    class Meta:
        model = BaseUser

    email = fake("ascii_email")
    is_staff = fake("boolean")
    role = UserRole.BASE


class ArtistFactory(BaseUserFactory):
    role = UserRole.ARTIST
