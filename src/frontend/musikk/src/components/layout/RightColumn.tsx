

import { PlayerDisplay } from "@/components/player/PlayerDisplay";
import type { ISong } from "@/components/song/types";

interface RightColumnProps {
    selectedSong: ISong | null;
    currentTime?: number;
}

export function RightColumn({ selectedSong, currentTime }: RightColumnProps) {
    return (
        <div className="w-1/5 p-4 bg-red-600 overflow-y-auto">
            <div className="mb-6">
                <PlayerDisplay song={selectedSong} currentTime={currentTime} />
            </div>

            {/* Song Queue */}
            <div className="bg-white p-4 rounded-md">
                <h3 className="font-bold mb-4 text-center">Song Queue</h3>
                <ul className="space-y-4" role="list">
                    {Array(5)
                        .fill(0)
                        .map((_, i) => (
                            <li key={i} className="bg-gray-200 p-4 rounded-md">
                                <p className="text-gray-800 text-center">{'{ "author" : "song"}'}</p>
                            </li>
                        ))}
                </ul>
            </div>
        </div>
    );
}
