from typing import Optional

from django.db import models

from base.models import BaseModel


class PlaybackState(BaseModel):
    is_playing = models.BooleanField(default=False)

    def active_device(
        self,
    ) -> Optional["PlaybackDevice"]:  # can't do `| None` with forward declaration
        active_device = self.playbackdevice_set.filter(is_active=True)
        if active_device:
            return active_device[0]
        return None


class PlaybackDevice(BaseModel):
    name = models.CharField(max_length=255)
    is_active = models.BooleanField(default=False)
    playback_state = models.ForeignKey(PlaybackState, on_delete=models.CASCADE)
