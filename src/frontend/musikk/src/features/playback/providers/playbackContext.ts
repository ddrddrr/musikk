import { LocalPlaybackState } from "@/features/playback/types.ts";
import { AudioPlayerController } from "@/features/player/controller/AudioPlayerController.ts";
import { createContext } from "react";

export interface PlaybackContextProps {
    isThisDeviceActive: boolean;
    isPlaybackActive: boolean;
    playbackState: LocalPlaybackState | null;
}

export const PlaybackContext = createContext<PlaybackContextProps>(null!);

export const PlayerControllerContext = createContext<AudioPlayerController>(null!);
