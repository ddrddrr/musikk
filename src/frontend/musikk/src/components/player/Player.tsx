import { useQueue, useQueueChangeAPI } from "@/hooks/useQueueAPI.ts";
import { PlaybackContext } from "@/providers/playbackContext.ts";
import { useContext, useEffect, useMemo, useRef } from "react";

// @ts-expect-error, see shaka docs
import shaka from "shaka-player";

interface PlayerProps {
    onDurationChange?: (duration: number) => void;
    onTimeUpdate?: (currentTime: number) => void;
}

export function Player({ onDurationChange, onTimeUpdate }: PlayerProps) {
    const { queue } = useQueue();
    const { isPlaying } = useContext(PlaybackContext);
    const useShiftHeadMutation = useQueueChangeAPI();
    const audioRef = useRef<HTMLAudioElement>(null);
    const playerRef = useRef<shaka.Player | null>(null);

    const url = useMemo(() => {
        return queue?.head ? queue.nodes[0].song?.mpd : null;
    }, [queue?.head]);

    useEffect(() => {
        shaka.polyfill.installAll();

        const player = new shaka.Player();
        playerRef.current = player;

        return () => {
            player.destroy();
            playerRef.current = null;
        };
    }, []);

    useEffect(() => {
        const handlePlayback = async () => {
            const player = playerRef.current;
            const audioElem = audioRef.current;

            if (!player || !audioElem) return;

            if (url) {
                try {
                    await player.attach(audioElem);
                    await player.load(url);
                    await audioElem.play();
                } catch (err) {
                    console.error("Error during playback:", err);
                }
            } else {
                try {
                    await player.unload();
                    audioElem.pause();
                    audioElem.currentTime = 0;
                } catch (err) {
                    console.warn("Error stopping playback:", err);
                }
            }
        };

        handlePlayback();
    }, [url]);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        if (isPlaying) {
            audio.play().catch(console.warn);
        } else {
            audio.pause();
        }
    }, [isPlaying]);

    const handleLoadedMetadata = () => {
        const audio = audioRef.current;
        if (audio && onDurationChange) {
            onDurationChange(audio.duration);
        }
    };

    const handleTimeUpdate = () => {
        const audio = audioRef.current;
        if (audio && onTimeUpdate) {
            onTimeUpdate(audio.currentTime);
        }
    };

    return (
        <audio
            ref={audioRef}
            controls
            className="w-full"
            onLoadedMetadata={handleLoadedMetadata}
            onTimeUpdate={handleTimeUpdate}
            onEnded={() => useShiftHeadMutation.mutate({ action: "shift" })}
        />
    );
}
