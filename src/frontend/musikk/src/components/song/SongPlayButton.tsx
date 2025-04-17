import { ISong } from "@/components/song/types.ts";
import { PlaybackContext } from "@/providers/playbackContext.ts";
import { PlayingSongContext } from "@/providers/playingSongContext.ts";
import { Pause, Play } from "lucide-react";
import { useContext } from "react";

interface SongPlayButtonProps {
    song: ISong;
}

export function SongPlayButton({ song }: SongPlayButtonProps) {
    const { isPlaying } = useContext(PlaybackContext);
    const { handleSongPlayClick, playingSong } = useContext(PlayingSongContext);

    const isThisPlaying = isPlaying && song.uuid === playingSong?.uuid;

    const renderPlayPauseIcon = () => {
        if (!(song.uuid === playingSong?.uuid)) return <Play size={18} />;
        return isThisPlaying ? <Pause size={18} /> : <Play size={18} />;
    };

    return (
        <button
            className="bg-red-600 hover:bg-red-700 text-white border-2 border-black p-2 rounded-full flex items-center justify-center"
            onClick={() => {
                if (handleSongPlayClick) {
                    handleSongPlayClick(song);
                }
            }}
        >
            {renderPlayPauseIcon()}
        </button>
    );
}
