import { QueryErrorBox } from "@/features/common/QueryErrorBox.tsx";
import { usePlayer } from "@/features/player/hooks/usePlayer.ts";
import { PlayerBar } from "@/features/player/PlayerBar.tsx";
import { useQueue } from "@/features/song-queue/api/queries.ts";
import { useRef } from "react";

export function PlayerBox({ onToggleQueue }: { onToggleQueue: () => void }) {
    const audioRef = useRef<HTMLAudioElement>(null);
    const { error: queueError, refetch: queueRefetch } = useQueue();

    const { handleOnEnded, handleAudioStateChange, isMutedFallback, unmute } = usePlayer({
        audioRef,
    });

    const hasQueueError = queueError !== null;

    return (
        <div className="sticky right-0 bottom-0 left-0 z-10 border-t border-foreground bg-card">
            {hasQueueError && (
                <div className="p-4">
                    <QueryErrorBox
                        message="Failed to load playback queue"
                        onRetry={() => void queueRefetch()}
                    />
                </div>
            )}
            {!hasQueueError && (
                <PlayerBar
                    onToggleQueue={onToggleQueue}
                    isMutedFallback={isMutedFallback}
                    onUnmute={unmute}
                />
            )}

            {/*
                the audio elem is mounted even on non-active devices, because
                the audio graph binds to it via createMediaElementSource
                (1x/per elem, we can't unmount/remount cheaply)
                and the controller keeps the element from init
                the graph gets built on the first user gesture anywhere on the page
                this way, when this device later becomes active, audio can start without
                waiting for another gesture to satisfy the autoplay policy
            */}
            {/* eslint-disable-next-line jsx-a11y/media-has-caption -- songs have no caption files */}
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
