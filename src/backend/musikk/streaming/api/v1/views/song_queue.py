from django.db import transaction
from rest_framework import status
from rest_framework.generics import RetrieveAPIView, get_object_or_404
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from streaming.models.state import StreamingProfile
from streaming.permissions import IsPublicOrCollectionAuthor
from websockets.event_helpers import send_ws_event
from streaming.api.v1.serializers.song_queue import SongQueueSerializer
from streaming.models import SongQueue, SongQueueNode, Collection
from streaming.models.songs import CollectionSong


# TODO: rewrite as mixin?
class SongQueueBaseView(APIView):


    def get_song_queue(self, request: Request) -> SongQueue:
        return self.request.user.streamingprofile.song_queue


class SongQueueRetrieveView(SongQueueBaseView, RetrieveAPIView):
    serializer_class = SongQueueSerializer

    def get_object(self):
        return self.get_song_queue(self.request)


class SongQueueAddSongView(SongQueueBaseView):
    permission_classes = [IsPublicOrCollectionAuthor]

    def post(self, request, *args, **kwargs):
        song = get_object_or_404(CollectionSong, uuid=kwargs["uuid"])
        self.check_object_permissions(request, song)
        
        with transaction.atomic():
            song_queue = self.get_song_queue(request)
            song_queue.add_song(song=song, action=SongQueue.AddAction.ADD)

        send_ws_event(
            f"user_{self.request.user.uuid}",
            event_handler="base.event",
            event_name="invalidate.query",
            query_key=["queue"],
        )

        return Response(status=status.HTTP_204_NO_CONTENT)


class SongQueueAddCollectionView(SongQueueBaseView):
    permission_classes = [IsPublicOrCollectionAuthor]

    def post(self, request, *args, **kwargs):
        collection = get_object_or_404(Collection, uuid=kwargs["uuid"])
        self.check_object_permissions(request, collection)
        
        with transaction.atomic():
            song_queue = self.get_song_queue(request)
            song_queue.add_collection(
                collection=collection, action=SongQueue.AddAction.ADD
            )

        send_ws_event(
            f"user_{self.request.user.uuid}",
            event_handler="base.event",
            event_name="invalidate.query",
            query_key=["queue"],
        )

        return Response(status=status.HTTP_204_NO_CONTENT)


class SongQueueSetSongHeadView(SongQueueBaseView):
    permission_classes = [IsPublicOrCollectionAuthor]

    def post(self, request, *args, **kwargs):
        song = get_object_or_404(CollectionSong, uuid=kwargs["uuid"])
        self.check_object_permissions(request, song)
        
        with transaction.atomic():
            song_queue = self.get_song_queue(request)
            song_queue.add_song(song=song, action=SongQueue.AddAction.CHANGE_HEAD)

        send_ws_event(
            f"user_{self.request.user.uuid}",
            event_handler="base.event",
            event_name="invalidate.query",
            query_key=["queue"],
        )
        return Response(status=status.HTTP_204_NO_CONTENT)


class SongQueueSetCollectionHeadView(SongQueueBaseView):
    permission_classes = [IsPublicOrCollectionAuthor]

    def post(self, request, *args, **kwargs):
        collection = get_object_or_404(Collection, uuid=kwargs["uuid"])
        self.check_object_permissions(request, collection)
        
        with transaction.atomic():
            song_queue = self.get_song_queue(request)
            song_queue.add_collection(
                collection=collection, action=SongQueue.AddAction.CHANGE_HEAD
            )

        send_ws_event(
            f"user_{self.request.user.uuid}",
            event_handler="base.event",
            event_name="invalidate.query",
            query_key=["queue"],
        )
        return Response(status=status.HTTP_204_NO_CONTENT)


# TODO: implement
class SongQueueAppendRandomSongsView(SongQueueBaseView):
    def post(self, request, *args, **kwargs):
        # with transaction.atomic():
        #     song_queue = self.get_song_queue(request)
        #     song_queue.append_random_songs()
        #
        # send_ws_event(f"user_{self.request.user.uuid}", event_handler="base.event", event_name="invalidate.query", query_key=["queue"])
        # return Response(
        #     status=status.HTTP_201_CREATED,
        # )
        pass


class SongQueueRemoveNodeView(SongQueueBaseView):
    def post(self, request, *args, **kwargs):
        song_queue = self.get_song_queue(request)
        node = SongQueueNode.objects.get(uuid=kwargs["uuid"])
        if song_queue is node.song_queue:
            node.delete()
            send_ws_event(
                f"user_{self.request.user.uuid}",
                event_handler="base.event",
                event_name="invalidate.query",
                query_key=["queue"],
            )

            return Response(status=status.HTTP_200_OK)

        return Response(
            status=status.HTTP_403_FORBIDDEN,
            data={"error": "Node does not belong to this user's queue."},
        )


class SongQueueClearView(SongQueueBaseView):
    def post(self, request, *args, **kwargs):
        song_queue = self.get_song_queue(request)
        profile: StreamingProfile = self.request.user.streamingprofile
        with transaction.atomic():
            song_queue.clear()
            ps = profile.playback_state
            ps.is_playing = False
            ps.save()

        send_ws_event(
            f"user_{self.request.user.uuid}",
            event_handler="base.event",
            event_name="invalidate.query",
            query_key=["queue"],
        )

        send_ws_event(
            f"user_{self.request.user.uuid}",
            event_handler="base.event",
            event_name="invalidate.query",
            query_key=["playback"],
        )
        return Response(status=status.HTTP_204_NO_CONTENT)


class SongQueueShiftHeadView(SongQueueBaseView):
    def post(self, request, *args, **kwargs):
        song_queue = self.get_song_queue(request)
        if not song_queue.is_empty():
            shift_to_node = None
            if node_uuid := kwargs.get("uuid"):
                shift_to_node = get_object_or_404(SongQueueNode, uuid=node_uuid)
            song_queue.shift_head_forward(to=shift_to_node)
            send_ws_event(
                f"user_{self.request.user.uuid}",
                event_handler="base.event",
                event_name="invalidate.query",
                query_key=["queue"],
            )

            if song_queue.is_empty():
                profile = self.request.user.streamingprofile
                ps = profile.playback_state
                ps.is_playing = False
                ps.save()

                send_ws_event(
                    f"user_{self.request.user.uuid}",
                    event_handler="base.event",
                    event_name="invalidate.query",
                    query_key=["playback"],
                )

        return Response(status=status.HTTP_204_NO_CONTENT)


class SongQueueShiftHeadBackwardsView(SongQueueBaseView):
    def post(self, request, *args, **kwargs):
        song_queue = self.get_song_queue(request)
        if not song_queue.is_empty():
            song_queue.shift_head_backwards()
            send_ws_event(
                f"user_{self.request.user.uuid}",
                event_handler="base.event",
                event_name="invalidate.query",
                query_key=["queue"],
            )
        return Response(status=status.HTTP_204_NO_CONTENT)
