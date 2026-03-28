import { QueryErrorBox } from "@/features/common/QueryErrorBox.tsx";
import { PlaybackContext } from "@/features/playback/providers/playbackContext.ts";
import { Player } from "@/features/player/Player.tsx";
import { PlayerBar } from "@/features/player/PlayerBar.tsx";
import { SongQueue } from "@/features/song-queue/components/SongQueue.tsx";
import { memo, useContext, useRef, useState } from "react";

export const PlayerBox = memo(function PlayerBox() {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isQueueOpen, setIsQueueOpen] = useState(false);
    const [totalDuration, setTotalDuration] = useState(0);
    const [time, setTime] = useState(0);
    const [seeking, setSeeking] = useState(false);
    const { queueError, queueRefetch } = useContext(PlaybackContext);

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
            {isQueueOpen && (
                <div
                    className="overflow-y-auto border-t border-b border-black"
                    style={{ maxHeight: "calc(100vh - 64px - 72px)" }}
                >
                    <SongQueue />
                </div>
            )}

            <PlayerBar
                audioRef={audioRef}
                totalDuration={totalDuration}
                time={time}
                seeking={seeking}
                setSeeking={setSeeking}
                setIsQueueOpen={setIsQueueOpen}
                onSeekCommit={(t) => setTime(t)}
            />

            <div className="hidden">
                <Player
                    audioRef={audioRef}
                    onDurationChange={setTotalDuration}
                    onTimeUpdate={(currentTime) => {
                        if (!seeking) setTime(currentTime);
                    }}
                />
            </div>
        </div>
    );
});
