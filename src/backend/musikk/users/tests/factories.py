import factory
from users.models import BaseUser

fake = factory.Faker


class BaseUserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = BaseUser

    email = fake("ascii_email")
    first_name = fake("first_name")
    last_name = fake("last_name")
    display_name = fake("user_name")
    avatar = None
    is_admin = fake("boolean")
