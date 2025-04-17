import { Player } from "@/components/player/Player.tsx";
import { PlayerBar } from "@/components/player/PlayerBar.tsx";
import { useState } from "react";

export function PlayerBox() {
    const [duration, setDuration] = useState(0);
    const [time, setTime] = useState(0);

    return (
        <div className="sticky bottom-0 left-0 right-0 z-10 border-t border-black bg-white">
            <PlayerBar duration={duration} time={time} />
            <div className="hidden">
                <Player onDurationChange={setDuration} onTimeUpdate={setTime} />
            </div>
        </div>
    );
}
