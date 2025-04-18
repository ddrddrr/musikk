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
    const { isPlaying, setIsPlaying } = useContext(PlaybackContext);
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
        const initSong = async () => {
            const player = playerRef.current;
            const audio = audioRef.current;

            if (!player || !audio) return;

            if (url) {
                try {
                    await player.attach(audio);
                    await player.load(url);
                } catch (err) {
                    console.error("Error during playback:", err);
                }
            } else {
                try {
                    await player.unload();
                    audio.pause();
                    audio.currentTime = 0;
                } catch (err) {
                    console.warn("Error stopping playback:", err);
                }
            }
        };

        initSong();
    }, [url]);

    // TODO: when url changes, we need to wait for the new data to load
    //  and only then play somehow
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        if (isPlaying) {
            audio.play().catch(console.warn);
        } else {
            audio.pause();
        }
    }, [isPlaying]);

    function handleLoadedMetadata() {
        const audio = audioRef.current;
        if (audio && onDurationChange) {
            onDurationChange(audio.duration);
        }
    }

    function handleTimeUpdate() {
        const audio = audioRef.current;
        if (audio && onTimeUpdate) {
            onTimeUpdate(audio.currentTime);
        }
    }

    function handleOnEnded() {
        useShiftHeadMutation.mutate({ action: "shift" });
        setIsPlaying(true);
    }

    return (
        <audio
            ref={audioRef}
            controls
            className="w-full"
            onLoadedMetadata={handleLoadedMetadata}
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleOnEnded}
        />
    );
}
