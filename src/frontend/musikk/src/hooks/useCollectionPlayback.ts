import { ISongCollectionDetailed } from "@/components/song-collection/types.ts";
import { useQueueAddAPI } from "@/hooks/useQueueAPI.ts";
import { useState } from "react";

interface UseCollectionPlaybackProps {
    isPlaying: boolean;
    setIsPlaying: (val: boolean) => void;
}

export function useCollectionPlayback({ isPlaying, setIsPlaying }: UseCollectionPlaybackProps) {
    const [playingCollection, setPlayingCollection] = useState<ISongCollectionDetailed | null>(null);
    const addToQueueMutation = useQueueAddAPI();

    function handleCollectionPlayClick(collection: ISongCollectionDetailed) {
        if (collection.uuid === playingCollection?.uuid) {
            setIsPlaying(!isPlaying);
            return;
        }
        if (collection.songs.length === 0) return;

        addToQueueMutation.mutate({ type: "collection", item: collection, action: "setHead" });
        setIsPlaying(true);
        setPlayingCollection(collection);
    }

    return {
        playingCollection,
        setPlayingCollection,
        handleCollectionPlayClick,
    };
}
