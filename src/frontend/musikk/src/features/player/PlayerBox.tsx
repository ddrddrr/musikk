import { QueryErrorBox } from "@/features/common/QueryErrorBox.tsx";
import { PlaybackContext } from "@/features/playback/providers/playbackContext.ts";
import { useAudioPipeline } from "@/features/player/hooks/useAudioPipeline.ts";
import { usePlayer } from "@/features/player/hooks/usePlayer.ts";
import { PlayerBar } from "@/features/player/PlayerBar.tsx";
import React, { useContext, useRef } from "react";

export function PlayerBox({
    setIsQueueOpen,
}: {
    setIsQueueOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) {
    const audioRef = useRef<HTMLAudioElement>(null);
    const { queueError, queueRefetch, playbackState, setAudioElemDurationSec } =
        useContext(PlaybackContext);

    const { ensureAudioPipeline, setUserVolume, fadeIn, fadeOut } = useAudioPipeline({
        audioRef,
        song: playbackState?.collectionSong.song,
    });

    const { handleLoadedMetadata, handleOnEnded, isMutedFallback, unmute } = usePlayer({
        audioRef,
        ensureAudioPipeline,
        fadeIn,
        fadeOut,
        onDurationChange: setAudioElemDurationSec,
    });

    if (queueError) {
        return (
            <div className="sticky right-0 bottom-0 left-0 z-10 border-t border-foreground bg-card p-4">
                <QueryErrorBox message="Failed to load playback queue" onRetry={queueRefetch} />
            </div>
        );
    }

    return (
        <div className="sticky right-0 bottom-0 left-0 z-10 border-t border-foreground bg-card">
            <PlayerBar
                setIsQueueOpen={setIsQueueOpen}
                isMutedFallback={isMutedFallback}
                onUnmute={unmute}
                setUserVolume={setUserVolume}
            />

            {/*
                the audio elem is mounted even on non-active devices because
                useAudioPipeline binds to it via createMediaElementSource
                (1x/per elem, we can't unmount/remount cheaply)
                and the pipeline gets built on the first user gesture anywhere on the page
                this way, when this device later becomes active, audio can start without
                waiting for another gesture to satisfy the autoplay policy
            */}
            <audio
                ref={audioRef}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={handleOnEnded}
                className="hidden"
            />
        </div>
    );
}
