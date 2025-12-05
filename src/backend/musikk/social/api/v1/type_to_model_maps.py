from streaming.models import Collection, CollectionSong
from users.models import BaseUser

CREATED_FOR_TYPE_TO_MODEL_MAP = {"collection": Collection, "feed": BaseUser}
ATTACHMENT_TYPE_TO_MODEL_MAP = {"collection": Collection, "song": CollectionSong}
