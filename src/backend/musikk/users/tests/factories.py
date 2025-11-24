import factory
from factory import SubFactory

from base.tests.factories import BaseModelFactory
from users.models import BaseUser
from users.models.profiles import StreamingProfile, ArtistProfile, BaseProfile

fake = factory.Faker


class BaseUserFactory(BaseModelFactory):
    class Meta:
        model = BaseUser

    email = fake("ascii_email")
    is_staff = fake("boolean")


class BaseProfileFactory(BaseModelFactory):
    class Meta:
        model = BaseProfile

    display_name = fake("user_name")
    bio = fake("paragraph")
    avatar = None

    user = SubFactory(BaseUserFactory)


class StreamingProfileFactory(BaseModelFactory):
    class Meta:
        model = StreamingProfile
        django_get_or_create = ("user",)

    user = SubFactory(BaseUserFactory)

    @classmethod
    def _create(cls, model_class, *args, **kwargs):
        user = kwargs.pop("user")
        return StreamingProfile.objects.get_or_create_for_user(user)


class ArtistProfileFactory(BaseModelFactory):
    class Meta:
        model = ArtistProfile

    user = SubFactory(BaseUserFactory)
