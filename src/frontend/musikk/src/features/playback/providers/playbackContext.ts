import { LocalPlaybackState } from "@/features/playback/types.ts";
import { AudioPlayerController } from "@/features/player/AudioPlayerController.ts";
import { createContext, Dispatch, SetStateAction } from "react";

export interface PlaybackContextProps {
    isThisDeviceActive: boolean;
    isPlaybackActive: boolean;
    playbackState: LocalPlaybackState | null;
    queueError: Error | null;
    queueRefetch: () => void;
    totalDuration: number;
    setAudioElemDurationSec: Dispatch<SetStateAction<number>>;
}

export const PlaybackContext = createContext<PlaybackContextProps>(null!);

export const PlayerControllerContext = createContext<AudioPlayerController>(null!);
