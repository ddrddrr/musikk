import { QueryErrorBox } from "@/features/common/QueryErrorBox.tsx";
import { PlaybackContext } from "@/features/playback/providers/playbackContext.ts";
import { useAudioPipeline } from "@/features/player/hooks/useAudioPipeline.ts";
import { usePlayer } from "@/features/player/hooks/usePlayer.ts";
import { PlayerBar } from "@/features/player/PlayerBar.tsx";
import React, { memo, useContext, useRef, useState } from "react";

export const PlayerBox = memo(function PlayerBox({
    setIsQueueOpen,
}: {
    setIsQueueOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [seeking, setSeeking] = useState(false);
    const { queueError, queueRefetch, playingCollectionSong, setCurrentTime, setTotalDuration } =
        useContext(PlaybackContext);

    const { ensureAudioPipeline, setUserVolume, fadeIn, fadeOut } = useAudioPipeline({
        audioRef,
        song: playingCollectionSong?.song,
    });

    const { handleLoadedMetadata, handleTimeUpdate, handleOnEnded, isMutedFallback, unmute } =
        usePlayer({
            audioRef,
            ensureAudioPipeline,
            fadeIn,
            fadeOut,
            onDurationChange: setTotalDuration,
            onTimeUpdate: (currentTime) => {
                if (!seeking) setCurrentTime(currentTime);
            },
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
                audioRef={audioRef}
                seeking={seeking}
                setSeeking={setSeeking}
                setIsQueueOpen={setIsQueueOpen}
                isMutedFallback={isMutedFallback}
                onUnmute={unmute}
                setUserVolume={setUserVolume}
                fadeIn={fadeIn}
                fadeOut={fadeOut}
            />

            <audio
                ref={audioRef}
                onLoadedMetadata={handleLoadedMetadata}
                onTimeUpdate={handleTimeUpdate}
                onEnded={handleOnEnded}
                className="hidden"
            />
        </div>
    );
});
