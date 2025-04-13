import { SongCollectionContainer } from "@/components/song-collection/SongCollectionContainer";
import type { ISongCollection } from "@/components/song-collection/types";
import type { ISong } from "@/components/song/types";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";

interface CenterColumnProps {
    selectedCollection: ISongCollection | null;
    selectedSong: ISong | null;
    handleSongClick: (song: ISong) => void;
    onBackClick: () => void;
}

export function CenterColumn({ selectedCollection, selectedSong, handleSongClick, onBackClick }: CenterColumnProps) {
    return (
        <div className="w-3/5 flex flex-col bg-red-600 border-l border-r border-red-700">
            {/* Collection Content */}
            <div className="flex-1 overflow-y-auto p-4">
                {selectedCollection ? (
                    <SongCollectionContainer
                        collection={selectedCollection}
                        selectedSong={selectedSong}
                        handleSongClick={handleSongClick}
                        onBackClick={onBackClick}
                    />
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center p-8 text-white bg-red-500 rounded-md max-w-md">
                            <p className="text-xl mb-4">Hi!</p>
                            <p>Select something to play:)</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Player Controls */}
            <div className="bg-white p-4 m-4 rounded-md">
                <div className="flex justify-center items-center gap-6 p-4 bg-red-600 rounded-md">
                    <button className="text-white hover:text-gray-200">
                        <ChevronLeft size={32} />
                    </button>
                    <button
                        className="text-white hover:text-gray-200 border-2 border-black p-2 rounded"
                        onClick={() => {
                            if (selectedSong) handleSongClick(selectedSong);
                        }}
                    >
                        {selectedSong ? <Pause size={32} /> : <Play size={32} />}
                    </button>
                    <button className="text-white hover:text-gray-200">
                        <ChevronRight size={32} />
                    </button>
                </div>
            </div>
        </div>
    );
}
