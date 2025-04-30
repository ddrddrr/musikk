# from streaming.api.v1.serializers_song_collection import SongCollectionSerializerBasic
# from streaming.api.v1.serializers_song_queue import SongQueueSerializer
# from users.api.v1.serializers_base import BaseUserSerializer
# from users.users_extended import StreamingUser
#
#
# class StreamingUserSerializer(BaseUserSerializer):
#     liked_songs = SongCollectionSerializerBasic(read_only=True)
#     followed_song_collections = SongCollectionSerializerBasic(many=True, required=False)
#     song_queue = SongQueueSerializer(read_only=True)
#     # created_playlists = PlaylistSerializerBasic(many=True, required=False)
#
#     class Meta:
#         model = StreamingUser
#         fields = BaseUserSerializer.Meta.fields + [
#             "liked_songs",
#             "followed_song_collections",
#             "song_queue",
#             # "created_playlists",
#         ]
