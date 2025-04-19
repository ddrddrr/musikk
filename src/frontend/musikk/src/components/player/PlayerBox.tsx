import { Player } from "@/components/player/Player.tsx";
import { PlayerBar } from "@/components/player/PlayerBar.tsx";
import { memo, useState } from "react";

export const PlayerBox = memo(function PlayerBox() {
    const [duration, setDuration] = useState(0);
    const [time, setTime] = useState(0);
    const [seeking, setSeeking] = useState(false);

    return (
        <div className="sticky bottom-0 left-0 right-0 z-10 border-t border-black bg-white">
            <PlayerBar duration={duration} time={time} seeking={seeking} setSeeking={setSeeking} />
            <div className="hidden">
                <Player
                    onDurationChange={setDuration}
                    onTimeUpdate={(currentTime) => {
                        if (!seeking) {
                            setTime(currentTime);
                        }
                    }}
                />
            </div>
        </div>
    );
});
