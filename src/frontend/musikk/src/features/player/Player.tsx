import { PlaybackContext } from "@/features/playback/providers/playbackContext.ts";
import { useQueueChangeAPI } from "@/features/song-queue/hooks/useQueueAPI.ts";
import { useContext, useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";

import shaka from "shaka-player";

interface PlayerProps {
    audioRef: React.RefObject<HTMLAudioElement>;
    onDurationChange?: (duration: number) => void;
    onTimeUpdate?: (currentTime: number) => void;
}

export function Player({ audioRef, onDurationChange, onTimeUpdate }: PlayerProps) {
    const { isThisDeviceActive, isPlaybackActive, queueHead, playingCollectionSong } =
        useContext(PlaybackContext);
    const useShiftHeadMutation = useQueueChangeAPI();
    const playerRef = useRef<shaka.Player | null>(null);
    const isAudioReadyRef = useRef(false);

    // TODO: we need to split by OS not browser (ios -> m3u8, otherwise mpd...?)
    const isSafari = useMemo(() => {
        return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    }, []);

    const url = useMemo(() => {
        if (!playingCollectionSong) return undefined;
        return isSafari ? playingCollectionSong.song.m3u8 : playingCollectionSong.song.mpd;
    }, [queueHead, playingCollectionSong, isSafari]);

    useEffect(() => {
        // removes browser incompatibilities, see
        // https://shaka-player-demo.appspot.com/docs/api/tutorial-basic-usage.html
        shaka.polyfill.installAll();
        if (!shaka.Player.isBrowserSupported()) {
            toast.error("Your browser is not supported for audio playback.");
            return;
        }

        const player = new shaka.Player();
        playerRef.current = player;

        player.addEventListener("error", (event: Event) => {
            const detail = (event as CustomEvent).detail;
            toast.error(detail?.message ?? "An audio streaming error occurred.");
        });
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
                } catch {
                    toast.error("Failed to load audio. Please try again.");
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

    // TODO: improve, try to remove
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        let timeoutId: NodeJS.Timeout;

        const tryPlay = () => {
            if (queueHead && isThisDeviceActive) {
                if (isAudioReadyRef.current) {
                    if (isPlaybackActive) {
                        audio.play().catch((err: unknown) => {
                            if (err instanceof DOMException && err.name === "AbortError") return;
                            toast.error("Playback failed. Please try again.");
                        });
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
    }, [queueHead?.uuid, isThisDeviceActive, isPlaybackActive]);

    function handleOnEnded() {
        isAudioReadyRef.current = false;
        useShiftHeadMutation.mutate({ action: "shift" });
    }

    // handles badly padded song ends, needed, e.g., for very short audio
    // TODO: try to remove as well
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
    }, [queueHead?.uuid, isThisDeviceActive, useShiftHeadMutation]);

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
