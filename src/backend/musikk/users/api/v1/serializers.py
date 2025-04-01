from base.serializers import BaseModelSerializer
from streaming.api.v1.serializers import (
    SongCollectionSerializerBasic,
    PlaylistSerializerBasic,
)
from users.user_base import BaseUser
from users.users_extended import StreamingUser


class BaseUserSerializer(BaseModelSerializer):
    class Meta:
        model = BaseUser
        fields = [
            "email",
            "first_name",
            "last_name",
            "display_name",
            "avatar",
            "is_admin",
        ]


class StreamingUserSerializer(BaseUserSerializer):
    followed_song_collections = SongCollectionSerializerBasic(many=True, required=False)
    created_playlists = PlaylistSerializerBasic(many=True, required=False)

    class Meta:
        model = StreamingUser
        fields = BaseUserSerializer.Meta.fields + [
            "liked_songs",
            "followed_song_collections",
            "created_playlists",
            "song_queue",
        ]
