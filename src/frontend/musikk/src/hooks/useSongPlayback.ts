import { ISong } from "@/components/songs/types.ts";
import { useQueueAddAPI } from "@/hooks/useQueueAPI.ts";
import { useState } from "react";

interface UseSongPlaybackProps {
    isPlaying: boolean;
    setIsPlaying: (val: boolean) => void;
}

export function useSongPlayback({ isPlaying, setIsPlaying }: UseSongPlaybackProps) {
    const [playingSong, setPlayingSong] = useState<ISong | null>(null);
    const addToQueueMutation = useQueueAddAPI();

    function handleSongPlayClick(song: ISong) {
        if (song.uuid === playingSong?.uuid) {
            setIsPlaying(!isPlaying);
            return;
        }

        addToQueueMutation.mutate({ type: "song", item: song, action: "setHead" });
        setIsPlaying(true);
        setPlayingSong(song);
    }

    return {
        playingSong,
        setPlayingSong,
        handleSongPlayClick,
    };
}
