import { PlayerBox } from "@/components/player/PlayerBox.tsx";
import { SongCollectionContainer } from "@/components/song-collection/SongCollectionContainer";
import type { ISongCollection } from "@/components/song-collection/types";

interface CenterColumnProps {
    selectedCollection: ISongCollection | null;
    onBackClick: () => void;
}

export function CenterColumn({ selectedCollection, onBackClick }: CenterColumnProps) {
    return (
        <div className="flex flex-col w-3/5 border-l border-r border-red-700 ">
            <div className="flex-1 overflow-y-auto p-4 pb-32">
                {selectedCollection ? (
                    <SongCollectionContainer collection={selectedCollection} onBackClick={onBackClick} />
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center p-8 text-white bg-red-500 rounded-md max-w-md border-2 border-black">
                            <p className="text-xl mb-4">Welcome to Music Player</p>
                            <p>Select a collection from the left to start playing music</p>
                        </div>
                    </div>
                )}
            </div>
            <PlayerBox />
        </div>
    );
}
