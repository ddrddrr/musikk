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
    const { queueError, queueRefetch, playbackState } = useContext(PlaybackContext);

    const { ensureAudioPipeline, setUserVolume, fadeIn, fadeOut } = useAudioPipeline({
        audioRef,
        song: playbackState?.collectionSong.song,
    });

    const { handleOnEnded, handleAudioStateChange, isMutedFallback, unmute } = usePlayer({
        audioRef,
        ensureAudioPipeline,
        fadeIn,
        fadeOut,
    });

    const hasQueueError = queueError !== null;

    return (
        <div className="sticky right-0 bottom-0 left-0 z-10 border-t border-foreground bg-card">
            {hasQueueError && (
                <div className="p-4">
                    <QueryErrorBox message="Failed to load playback queue" onRetry={queueRefetch} />
                </div>
            )}
            {!hasQueueError && (
                <PlayerBar
                    setIsQueueOpen={setIsQueueOpen}
                    isMutedFallback={isMutedFallback}
                    onUnmute={unmute}
                    setUserVolume={setUserVolume}
                />
            )}

            {/*
                the audio elem is mounted even on non-active devices, because
                useAudioPipeline binds to it via createMediaElementSource
                (1x/per elem, we can't unmount/remount cheaply)
                and the controller keeps the element from init
                the pipeline gets built on the first user gesture anywhere on the page
                this way, when this device later becomes active, audio can start without
                waiting for another gesture to satisfy the autoplay policy
            */}
            <audio
                ref={audioRef}
                onEnded={handleOnEnded}
                onPlay={handleAudioStateChange}
                onPause={handleAudioStateChange}
                onSeeked={handleAudioStateChange}
                onPlaying={handleAudioStateChange}
                className="hidden"
            />
        </div>
    );
}
