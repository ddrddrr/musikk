import uuid
import factory

from base.models import BaseModel

fake = factory.Faker


class BaseModelFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = BaseModel
        abstract = True

    uuid = factory.LazyFunction(uuid.uuid4)
    date_added = fake("date_time_this_year")
    date_modified = factory.LazyAttribute(lambda o: o.date_added)
