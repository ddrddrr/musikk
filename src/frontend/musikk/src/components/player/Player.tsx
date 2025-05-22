import { useQueueChangeAPI } from "@/components/song-queue/hooks/useQueueAPI.ts";
import { PlaybackContext } from "@/providers/playbackContext.ts";
import { useContext, useEffect, useMemo, useRef } from "react";

// @ts-expect-error, see shaka docs
import shaka from "shaka-player";

interface PlayerProps {
    onDurationChange?: (duration: number) => void;
    onTimeUpdate?: (currentTime: number) => void;
}

export function Player({ onDurationChange, onTimeUpdate }: PlayerProps) {
    const { isThisDeviceActive, playbackState, queueHead, playingCollectionSong } = useContext(PlaybackContext);
    const useShiftHeadMutation = useQueueChangeAPI();
    const audioRef = useRef<HTMLAudioElement>(null);
    const playerRef = useRef<shaka.Player | null>(null);
    const isAudioReadyRef = useRef(false);

    const isSafari = useMemo(() => {
        return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    }, []);

    const url = useMemo(() => {
        if (!playingCollectionSong) return undefined;
        return isSafari ? playingCollectionSong.song.m3u8 : playingCollectionSong.song.mpd;
    }, [queueHead, playingCollectionSong, isSafari]);

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
        const initPlayback = async () => {
            isAudioReadyRef.current = false;
            const player = playerRef.current;
            const audio = audioRef.current;

            if (!player || !audio) return;

            if (url && queueHead) {
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
    }, [queueHead?.uuid, url]);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        let timeoutId: NodeJS.Timeout;

        const tryPlay = () => {
            if (queueHead && isThisDeviceActive) {
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
    }, [queueHead?.uuid, isThisDeviceActive, playbackState?.is_playing]);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const interval = setInterval(() => {
            if (
                isThisDeviceActive &&
                queueHead &&
                isAudioReadyRef.current &&
                !audio.ended &&
                audio.duration - audio.currentTime < 0.5 &&
                !audio.paused
            ) {
                handleOnEnded();
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [queueHead?.uuid, isThisDeviceActive]);

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
