import {
    PlaybackSetPayload,
    PlaybackSnapshotPayload,
} from "@/features/playback/ws/playbackPayload.ts";
import { AudioPlayerController } from "@/features/player/controller/AudioPlayerController.ts";
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
        const unsubSet = ws.subscribe("playback.set", (payload: PlaybackSetPayload) => {
            controller.applyCommand(payload);
        });
        return () => {
            unsubSnapshot();
            unsubSet();
        };
    }, [ws, controller]);
}
