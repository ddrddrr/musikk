

import { Play, Pause } from "lucide-react";

interface SongCardProps {
    title: string;
    artist: string;
    isPlaying: boolean;
    onClick: () => void;
}

export function SongCard(props: SongCardProps) {
    const { title, artist, isPlaying, onClick } = props;

    return (
        <div className="flex items-center justify-between">
            <div className="flex flex-col">
                <p className="text-gray-800 font-semibold">{title}</p>
                <p className="text-gray-600 text-sm">{artist}</p>
            </div>
            <button onClick={onClick} className="p-2 rounded-full hover:bg-gray-300">
                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
            </button>
        </div>
    );
}