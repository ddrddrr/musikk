import { ISong } from "@/components/song/types.ts";
import { PlaybackContext } from "@/providers/playbackContext.ts";
import { PlayingSongContext } from "@/providers/playingSongContext.ts";
import { Pause, Play } from "lucide-react";
import { useContext } from "react";

interface SongPlayButtonProps {
    song: ISong;
    className?: string;
    iconSize?: number; // size for the play/pause icon
}

export function SongPlayButton({ song, className = "", iconSize = 18 }: SongPlayButtonProps) {
    const { isPlaying } = useContext(PlaybackContext);
    const { handleSongPlayClick, playingSong } = useContext(PlayingSongContext);

    const isThisPlaying = isPlaying && song.uuid === playingSong?.uuid;

    const renderPlayPauseIcon = () => {
        if (!(song.uuid === playingSong?.uuid)) return <Play size={iconSize} />;
        return isThisPlaying ? <Pause size={iconSize} /> : <Play size={iconSize} />;
    };

    return (
        <button
            className={`bg-red-600 hover:bg-red-700 text-white border-2 border-black flex items-center justify-center rounded-full ${className}`}
            style={{ width: iconSize * 2, height: iconSize * 2 }}
            onClick={() => handleSongPlayClick?.(song)}
        >
            {renderPlayPauseIcon()}
        </button>
    );
}
