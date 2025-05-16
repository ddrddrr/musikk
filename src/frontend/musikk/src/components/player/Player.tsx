import { useQueueChangeAPI } from "@/hooks/useQueueAPI.ts";
import { usePlaybackStateMutation } from "@/playback/mutations.ts";
import { PlaybackContext } from "@/providers/playbackContext.ts";
import { useContext, useEffect, useMemo, useRef } from "react";

// @ts-expect-error, see shaka docs
import shaka from "shaka-player";

interface PlayerProps {
    onDurationChange?: (duration: number) => void;
    onTimeUpdate?: (currentTime: number) => void;
}

export function Player({ onDurationChange, onTimeUpdate }: PlayerProps) {
    const { isThisDeviceActive, playbackState, playingCollectionSong } = useContext(PlaybackContext);
    const playbackStateMutation = usePlaybackStateMutation();
    const useShiftHeadMutation = useQueueChangeAPI();
    const audioRef = useRef<HTMLAudioElement>(null);
    const playerRef = useRef<shaka.Player | null>(null);
    const isAudioReadyRef = useRef(false);

    const url = useMemo(() => {
        return playingCollectionSong?.song.mpd;
    }, [playingCollectionSong]);

    useEffect(() => {
        shaka.polyfill.installAll();

        const player = new shaka.Player();
        playerRef.current = player;
        return () => {
            player.destroy();
            playerRef.current = null;
        };
    }, []);

    // stop playback on refresh/first mount due to browser restrictions on autoplay
    // useEffect(() => {
    //     if (isThisDeviceActive) {
    //         playbackStateMutation.mutate({ isPlaying: false });
    //     }
    // }, [isThisDeviceActive]);

    useEffect(() => {
        const initPlayback = async () => {
            isAudioReadyRef.current = false;
            const player = playerRef.current;
            const audio = audioRef.current;

            if (!player || !audio) return;

            if (url) {
                try {
                    await player.attach(audio);
                    await player.load(url);
                    isAudioReadyRef.current = true;
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

        initPlayback();
    }, [url]);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        let timeoutId: NodeJS.Timeout;

        const tryPlay = () => {
            if (isThisDeviceActive) {
                if (isAudioReadyRef.current) {
                    if (playbackState?.is_playing) {
                        audio.play().catch(console.warn);
                    } else {
                        audio.pause();
                    }
                } else {
                    timeoutId = setTimeout(tryPlay, 100);
                }
            }
        };

        tryPlay();

        return () => {
            clearTimeout(timeoutId);
        };
    }, [url, isThisDeviceActive, playbackState?.is_playing]);

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

    async function handleOnEnded() {
        isAudioReadyRef.current = false;
        useShiftHeadMutation.mutate({ action: "shift" });
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
