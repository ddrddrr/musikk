import { SongQueue } from "@/components/song-queue/SongQueue.tsx";
import { memo } from "react";

export const RightColumn = memo(function RightColumn() {
    return (
        <div className="w-1/5 bg-red-600 p-4 pb-24 overflow-y-auto border-l border-red-700">
            <h2 className="text-xl font-bold text-white mb-4 text-center">Queue</h2>
            <div className="bg-white p-4 rounded-sm border-2 border-black">
                <SongQueue />
            </div>
        </div>
    );
});
