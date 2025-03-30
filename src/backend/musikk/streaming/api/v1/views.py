from rest_framework.generics import ListAPIView

from streaming.api.v1.serializers import SongSerializer, SongCollectionSerializerBasic
from streaming.song_collections import SongCollection
from streaming.songs import BaseSong


class SongListView(ListAPIView):
    queryset = BaseSong.objects.all()
    serializer_class = SongSerializer


class SongCollectionListView(ListAPIView):
    queryset = SongCollection.objects.all()
    serializer_class = SongCollectionSerializerBasic
