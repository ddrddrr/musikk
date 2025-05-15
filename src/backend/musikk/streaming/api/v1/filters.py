# from django_filters import rest_framework as filters
#
#
# class CollectionsPersonalFilter(filters.FilterSet):
#     type = filters.CharFilter(method="get_personal_collection")
#
#     def filter_personal_collection(self, queryset, name, value):
#         user = self.request.user.streaminguser
#         match name:
#             case "liked":
#                 return user.liked_songs
#             case "history":
#                 return user.history
#             case "followed":
#                 return user.followed_song_collections
#             case _:
#                 return queryset.none()
