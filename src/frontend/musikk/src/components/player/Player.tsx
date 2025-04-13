

import { useEffect, useRef } from "react";
// @ts-expect-error, see shaka docs
import shaka from "shaka-player";

interface PlayerProps {
    url: string | null;
    onDurationChange?: (duration: number) => void;
    onTimeUpdate?: (currentTime: number) => void;
}

export function Player({ url, onDurationChange, onTimeUpdate }: PlayerProps) {
    const audioRef = useRef<HTMLAudioElement>(null);
    const playerRef = useRef<shaka.Player | null>(null);

    useEffect(() => {
        shaka.polyfill.installAll();

        if (!shaka.Player.isBrowserSupported()) {
            console.error("Shaka Player not supported");
            return;
        }

        const player = new shaka.Player(); // no mediaElement here
        playerRef.current = player;

        return () => {
            player.destroy();
            playerRef.current = null;
        };
    }, []);

    useEffect(() => {
        const handlePlayback = async () => {
            const player = playerRef.current;
            const audio = audioRef.current;

            if (!player || !audio) return;

            if (url) {
                try {
                    await player.attach(audio);
                    await player.load(url);
                    await audio.play();
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

        handlePlayback();
    }, [url]);

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
        />
    );
}
