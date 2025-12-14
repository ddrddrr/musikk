import { Player } from "@/modules/player/Player.tsx";
import { PlayerBar } from "@/modules/player/PlayerBar.tsx";
import { SongQueue } from "@/modules/song-queue/components/SongQueue.tsx";
import { memo, useRef, useState } from "react";

export const PlayerBox = memo(function PlayerBox() {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isQueueOpen, setIsQueueOpen] = useState(false);
    const [totalDuration, setTotalDuration] = useState(0);
    const [time, setTime] = useState(0);
    const [seeking, setSeeking] = useState(false);

    return (
        <div className="sticky bottom-0 left-0 right-0 z-10 border-t border-black bg-white">
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
