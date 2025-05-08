import { useContext } from "react";
import { PlaybackContext } from "@/providers/playbackContext.ts";
import { usePlaybackActivateMutation, usePlaybackStopMutation } from "@/playback/mutations.ts";
import { useQueueAddAPI } from "@/hooks/useQueueAPI.ts";
import { ISongCollectionSong } from "@/components/song-collections/types.ts";

export function useControlPlayback() {
    const { playbackState, playingCollectionSong } = useContext(PlaybackContext);
    const playbackActivateMutation = usePlaybackActivateMutation();
    const playbackStopMutation = usePlaybackStopMutation();
    const addToQueueMutation = useQueueAddAPI();

    const isThisPlaying = playbackState?.is_playing && collectionSong.uuid === playingCollectionSong?.song.uuid;

    function handleSongPlayClick(collectionSong: ISongCollectionSong) {
        const deviceID = localStorage.getItem("deviceID");
        if (!deviceID) return;

        const isPlaying = playbackState?.is_playing;
        const isDifferentDevice = deviceID !== playbackState?.active_device?.uuid;

        if (!isPlaying || isDifferentDevice) {
            playbackActivateMutation.mutate({ deviceID });
        }

        if (!isPlaying && !isThisPlaying) {
            addToQueueMutation.mutate({
                type: "song",
                item: collectionSong,
                action: "setHead",
            });
        } else {
            playbackStopMutation.mutate();
        }
    }
}