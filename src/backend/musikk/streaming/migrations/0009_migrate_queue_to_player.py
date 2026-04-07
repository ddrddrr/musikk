from django.db import migrations


def forward(apps, schema_editor):
    StreamingProfile = apps.get_model("streaming", "StreamingProfile")
    PlaybackContext = apps.get_model("streaming", "PlaybackContext")
    PlayerState = apps.get_model("streaming", "PlayerState")
    QueueItem = apps.get_model("streaming", "QueueItem")

    for profile in StreamingProfile.objects.select_related("song_queue"):
        sq = profile.song_queue
        ctx = PlaybackContext.objects.create(
            collection_id=sq.context_collection_id,
            cursor=sq.context_cursor,
            skip_indices=sq.context_skip_indices,
        )
        ps = PlayerState.objects.create(
            current_collection_song_id=sq.current_collection_song_id,
            history_cursor=sq.history_cursor,
            queue=sq,
            context=ctx,
        )
        profile.player = ps
        profile.save(update_fields=["player"])

    QueueItem.objects.filter(origin="context").delete()


class Migration(migrations.Migration):

    dependencies = [
        ("streaming", "0008_playbackcontext_playerstate"),
    ]

    operations = [
        migrations.RunPython(forward, migrations.RunPython.noop),
    ]
