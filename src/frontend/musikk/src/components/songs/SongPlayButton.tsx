import { ISongCollectionSong } from "@/components/song-collections/types.ts";
import { Button } from "@/components/ui/button.tsx";
import { useHandlePlay } from "@/hooks/useHandlePlay.ts";
import { PlaybackContext } from "@/providers/playbackContext.ts";
import { Pause, Play } from "lucide-react";
import { useContext } from "react";

interface SongPlayButtonProps {
    collectionSong: ISongCollectionSong;
    className?: string;
    size?: number;
}

export function SongPlayButton({ collectionSong, className = "", size = 20 }: SongPlayButtonProps) {
    const { playbackState, playingCollectionSong } = useContext(PlaybackContext);
    const handlePlay = useHandlePlay();

    const isThisChosen = collectionSong.uuid === playingCollectionSong?.uuid;

    const renderPlayPauseIcon = () => {
        const iconSize = Math.floor(size * 0.6);
        return playbackState?.is_playing && isThisChosen ? <Pause size={iconSize} /> : <Play size={iconSize} />;
    };

    return (
        <Button
            style={{ width: size, height: size }}
            className={`bg-red-600 hover:bg-red-700 text-white border-2 border-black flex items-center justify-center rounded-sm p-0 ${className}`}
            onClick={() => (isThisChosen ? handlePlay() : handlePlay({ newSong: collectionSong }))}
        >
            {renderPlayPauseIcon()}
        </Button>
    );
}
