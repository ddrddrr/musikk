import {
    PlaybackSeekPayload,
    PlaybackSnapshotPayload,
} from "@/features/playback/ws/playbackPayload.ts";
import { AudioPlayerController } from "@/features/player/AudioPlayerController.ts";
import { useWSClient } from "@/hooks/useWSClient.ts";
import { useEffect } from "react";

// ideally ws event subscribers should not depend on any other args, but here
// I couldn't think of a better way that wouldn't be clunky
export function useSubscribePlaybackEvents(controller: AudioPlayerController): void {
    const ws = useWSClient();
    useEffect(() => {
        const unsubSnapshot = ws.subscribe(
            "playback.snapshot",
            (payload: PlaybackSnapshotPayload) => {
                controller.applyServerSnapshot(payload);
            },
        );
        const unsubSeek = ws.subscribe("playback.seek", (payload: PlaybackSeekPayload) => {
            controller.applyServerSeek(payload);
        });
        return () => {
            unsubSnapshot();
            unsubSeek();
        };
    }, [ws, controller]);
}
