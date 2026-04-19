import { PlaybackContext } from "@/features/playback/providers/playbackContext.ts";
import { useQueueNext } from "@/features/song-queue/hooks/useQueueAPI.ts";
import { useContext, useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";

import shaka from "shaka-player";

const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

interface UsePlayerOptions {
    audioRef: React.RefObject<HTMLAudioElement>;
    onDurationChange?: (duration: number) => void;
    onTimeUpdate?: (currentTime: number) => void;
}

interface UsePlayerReturn {
    handleLoadedMetadata: () => void;
    handleTimeUpdate: () => void;
    handleOnEnded: () => void;
}

function tryPlay(audio: HTMLAudioElement) {
    audio.play().catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        toast.error("Playback failed. Please try again.");
    });
}

export function usePlayer({
    audioRef,
    onDurationChange,
    onTimeUpdate,
}: UsePlayerOptions): UsePlayerReturn {
    const { isThisDeviceActive, isPlaybackActive, playingCollectionSong } =
        useContext(PlaybackContext);
    const nextMutation = useQueueNext();
    const playerRef = useRef<shaka.Player | null>(null);
    const isAudioReadyRef = useRef(false);

    // kinda wacky, but didn't figure out a better way to always have a fresh value for those
    const isPlaybackActiveRef = useRef(isPlaybackActive);
    isPlaybackActiveRef.current = isPlaybackActive;
    const isThisDeviceActiveRef = useRef(isThisDeviceActive);
    isThisDeviceActiveRef.current = isThisDeviceActive;

    // TODO: split by OS not browser (ios -> m3u8, otherwise mpd)
    const url = useMemo(() => {
        if (!playingCollectionSong) return undefined;
        return isSafari ? playingCollectionSong.song.m3u8 : playingCollectionSong.song.mpd;
    }, [playingCollectionSong, isSafari]);

    function initShakaPlayer() {
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
    }

    useEffect(initShakaPlayer, []);

    function loadOrUnloadSong() {
        // guards against e.g. the user shifting to the next song inbetween the attach and load
        // since the control yields to the event loop and the flag value can flip
        let cancelled = false;

        const initPlayback = async () => {
            isAudioReadyRef.current = false;
            const player = playerRef.current;
            const audio = audioRef.current;

            if (!player || !audio) return;

            if (url && playingCollectionSong) {
                try {
                    await player.attach(audio);
                    if (cancelled) return;
                    await player.load(url);
                    if (cancelled) return;
                    isAudioReadyRef.current = true;

                    if (isPlaybackActiveRef.current && isThisDeviceActiveRef.current) {
                        tryPlay(audio);
                    }
                } catch {
                    if (cancelled) return;
                    toast.error("Failed to load audio. Please try again.");
                }
            } else {
                try {
                    await player.unload();
                } catch {
                    // unload can fail when the player is already being destroyed during cleanup
                }
                if (!cancelled && audio) {
                    audio.pause();
                    audio.currentTime = 0;
                }
            }
        };

        initPlayback();
        return () => {
            cancelled = true;
        };
    }

    useEffect(loadOrUnloadSong, [playingCollectionSong?.uuid, url]);

    function syncPlayPauseWithState() {
        const audio = audioRef.current;
        if (!audio || !isAudioReadyRef.current || !playingCollectionSong) return;
        if (!isThisDeviceActive) return;

        if (isPlaybackActive) {
            tryPlay(audio);
        } else {
            audio.pause();
        }
    }

    useEffect(syncPlayPauseWithState, [isPlaybackActive, isThisDeviceActive]);

    function handleOnEnded() {
        isAudioReadyRef.current = false;
        nextMutation.mutate();
    }

    function handleLoadedMetadata() {
        const audio = audioRef.current;
        if (audio) {
            onDurationChange?.(audio.duration);
        }
    }

    function handleTimeUpdate() {
        const audio = audioRef.current;
        if (!audio) return;

        onTimeUpdate?.(audio.currentTime);

        if (
            isThisDeviceActive &&
            playingCollectionSong &&
            isAudioReadyRef.current &&
            !audio.ended &&
            !audio.paused &&
            audio.duration - audio.currentTime < 0.5
        ) {
            handleOnEnded();
        }
    }

    return { handleLoadedMetadata, handleTimeUpdate, handleOnEnded };
}
