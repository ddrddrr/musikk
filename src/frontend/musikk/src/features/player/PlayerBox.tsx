import { QueryErrorBox } from "@/features/common/QueryErrorBox.tsx";
import { PlaybackContext } from "@/features/playback/providers/playbackContext.ts";
import { usePlayer } from "@/features/player/hooks/usePlayer.ts";
import { PlayerBar } from "@/features/player/PlayerBar.tsx";
import React, { memo, useContext, useRef, useState } from "react";

export const PlayerBox = memo(function PlayerBox({
    setIsQueueOpen,
}: {
    setIsQueueOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [totalDuration, setTotalDuration] = useState(0);
    const [time, setTime] = useState(0);
    const [seeking, setSeeking] = useState(false);
    const { queueError, queueRefetch } = useContext(PlaybackContext);

    const { handleLoadedMetadata, handleTimeUpdate, handleOnEnded } = usePlayer({
        audioRef,
        onDurationChange: setTotalDuration,
        onTimeUpdate: (currentTime) => {
            if (!seeking) setTime(currentTime);
        },
    });

    // TODO: fine for now, but probably move
    if (queueError) {
        return (
            <div className="sticky right-0 bottom-0 left-0 z-10 border-t border-black bg-white p-4">
                <QueryErrorBox message="Failed to load playback queue" onRetry={queueRefetch} />
            </div>
        );
    }

    return (
        <div className="sticky right-0 bottom-0 left-0 z-10 border-t border-black bg-white">
            <PlayerBar
                audioRef={audioRef}
                totalDuration={totalDuration}
                time={time}
                seeking={seeking}
                setSeeking={setSeeking}
                setIsQueueOpen={setIsQueueOpen}
                onSeekCommit={(t) => setTime(t)}
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
