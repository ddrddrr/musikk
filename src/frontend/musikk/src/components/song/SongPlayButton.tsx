import { ISong } from "@/components/song/types.ts";
import { Button } from "@/components/ui/button.tsx";
import { PlaybackContext } from "@/providers/playbackContext.ts";
import { PlayingSongContext } from "@/providers/playingSongContext.ts";
import { Pause, Play } from "lucide-react";
import { useContext } from "react";

interface SongPlayButtonProps {
    song: ISong;
    className?: string;
    size?: number; // size for the play/pause icon
}

export function SongPlayButton({ song, className = "", size = 18 }: SongPlayButtonProps) {
    const { isPlaying } = useContext(PlaybackContext);
    const { handleSongPlayClick, playingSong } = useContext(PlayingSongContext);

    const isThisPlaying = isPlaying && song.uuid === playingSong?.uuid;

    const renderPlayPauseIcon = () => {
        if (!(song.uuid === playingSong?.uuid)) return <Play size={size} />;
        return isThisPlaying ? <Pause size={size} /> : <Play size={size} />;
    };

    return (
        <Button
            className={`bg-red-600 hover:bg-red-700 text-white border-2 border-black flex items-center justify-center rounded-sm ${className}`}
            onClick={() => handleSongPlayClick?.(song)}
        >
            {renderPlayPauseIcon()}
        </Button>
    );
}
