import { PlayerControllerContext } from "@/features/playback/providers/playbackContext.ts";
import { AudioPlayerController } from "@/features/player/controller/AudioPlayerController.ts";
import { useContext } from "react";

export function usePlayerController(): AudioPlayerController {
    const controller = useContext(PlayerControllerContext);
    if (!controller) {
        throw new Error("usePlayerController must be used within a PlaybackProvider");
    }
    return controller;
}
