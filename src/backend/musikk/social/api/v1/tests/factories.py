import factory
from factory import SubFactory

from base.tests.factories import BaseModelFactory
from social.models import Publication
from streaming.tests.factories import CollectionFactory
from users.tests.factories import BaseUserFactory

fake = factory.Faker


class UserContentFactory(BaseModelFactory):
    author = SubFactory(BaseUserFactory)
    content = fake("paragraph", nb_sentences=2)
    is_deleted = False

    class Meta:
        abstract = True


class PublicationFactory(UserContentFactory):
    class Meta:
        model = Publication

    parent = None
    created_for_object = SubFactory(CollectionFactory)
    attachment_object = None

    @classmethod
    def _create(cls, model_class, *args, **kwargs):
        parent = kwargs.pop("parent", None)
        created_for_object = kwargs.pop("created_for_object", None)
        attachment_object = kwargs.pop("attachment_object", None)

        instance = model_class(**kwargs)

        if parent:
            instance.parent = parent
            if not created_for_object:
                created_for_object = parent.get_root().created_for_object

        if created_for_object:
            instance.created_for_object = created_for_object

        if attachment_object:
            instance.attachment_object = attachment_object

        instance.save()
        return instance
