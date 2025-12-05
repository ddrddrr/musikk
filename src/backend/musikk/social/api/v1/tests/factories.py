import factory
from factory import SubFactory

from base.tests.factories import BaseModelFactory
from social.models import Publication
from streaming.tests.factories import CollectionFactory
from users.tests.factories import BaseUserFactory

fake = factory.Faker


class PublicationFactory(BaseModelFactory):
    class Meta:
        model = Publication

    author = SubFactory(BaseUserFactory)
    content = fake("paragraph", nb_sentences=2)
    parent = None
    is_deleted = False

    created_for_object = SubFactory(CollectionFactory)

    @classmethod
    def _create(cls, model_class, *args, **kwargs):
        """Override create to handle GenericForeignKey."""
        parent = kwargs.pop("parent", None)
        created_for_object = kwargs.pop("created_for_object", None)
        attachment_object = kwargs.pop("attachment_object", None)

        instance = model_class(**kwargs)

        if created_for_object:
            instance.created_for_object = created_for_object
        if attachment_object:
            instance.attachment_object = attachment_object
        if parent:
            instance.parent = parent
            
        instance.save()
        return instance
