import { PlaybackContext } from "@/features/playback/providers/playbackContext.ts";
import { useQueueNext } from "@/features/song-queue/hooks/useQueueAPI.ts";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import shaka from "shaka-player";

const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

interface UsePlayerOptions {
    audioRef: React.RefObject<HTMLAudioElement>;
    ensureAudioPipeline: () => void;
    onDurationChange?: (duration: number) => void;
    onTimeUpdate?: (currentTime: number) => void;
}

interface UsePlayerReturn {
    handleLoadedMetadata: () => void;
    handleTimeUpdate: () => void;
    handleOnEnded: () => void;
    isMutedFallback: boolean;
    unmute: () => void;
}

export function usePlayer({
    audioRef,
    ensureAudioPipeline,
    onDurationChange,
    onTimeUpdate,
}: UsePlayerOptions): UsePlayerReturn {
    const { isThisDeviceActive, isPlaybackActive, playingCollectionSong } =
        useContext(PlaybackContext);
    const nextMutation = useQueueNext();
    const playerRef = useRef<shaka.Player | null>(null);
    // whether the audio is loaded and can be manipulated with
    const isAudioReadyRef = useRef(false);
    const [isMutedFallback, setIsMutedFallback] = useState(false);

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

    async function tryPlay(audio: HTMLAudioElement) {
        try {
            await audio.play();
            if (isMutedFallback) setIsMutedFallback(false);
        } catch (err) {
            if (err instanceof DOMException && err.name === "AbortError") return;
            // if the user opens the app on a completely new device (non-active yet)
            // the new device becomes active and closes the active page
            // then, if the user re-opens the old window (which was active, but not anymore)
            // and resumes the playback, it should start on the new device
            // but if the user haven't interacted with the page on the new device,
            // autoplay will be blocked
            // muted playback is always allowed, so we fall back to it
            if (err instanceof DOMException && err.name === "NotAllowedError") {
                audio.muted = true;
                try {
                    await audio.play();
                    setIsMutedFallback(true);
                    return;
                } catch {
                    audio.muted = false;
                    toast.error("Playback failed. Please try again.");
                    return;
                }
            }
            toast.error("Playback failed. Please try again.");
        }
    }

    function unmute() {
        const audio = audioRef.current;
        if (!audio) return;
        // unmute click is the user gesture that lets us go over the autoplay policy
        // and build the AudioContext
        ensureAudioPipeline();
        audio.muted = false;
        setIsMutedFallback(false);
    }

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
        // guards against e.g. the user shifting to the next song inbetween the attach and load calls
        // on await player.attach() the control yields to the event loop and a func
        // that shifts a song can run in the meantime
        // that would change the url, i.e., run a new loadOrUnloadSong
        // there is always a single instace of a player so it is possible that it would run
        // player.load(url) on an (already) old url and then try to play it
        let cancelled = false;

        const initPlayback = async () => {
            isAudioReadyRef.current = false;

            const player = playerRef.current;
            const audio = audioRef.current;
            if (!player || !audio) return;

            if (url && isThisDeviceActiveRef.current) {
                try {
                    await player.attach(audio);
                    if (cancelled) return;
                    await player.load(url);
                    if (cancelled) return;
                    isAudioReadyRef.current = true;

                    // BE always sets playback=false on any active-device transition,
                    // so isPlaybackActive=true here means the user explicitly hit play
                    if (isPlaybackActiveRef.current && isThisDeviceActiveRef.current) {
                        void tryPlay(audio);
                    }
                } catch {
                    if (cancelled) return;
                    toast.error("Failed to load audio. Please try again.");
                }
            } else {
                try {
                    await player.unload();
                } catch {
                    // unload can fail when the player is already being destroyed by initShakaPlayer's cleanup
                    // so we just swallow the err and go along our day
                }
                if (!cancelled && audio) {
                    audio.pause();
                    audio.currentTime = 0;
                }
            }
        };

        void initPlayback();
        return () => {
            cancelled = true;
        };
    }
    useEffect(loadOrUnloadSong, [playingCollectionSong?.uuid, url, isThisDeviceActive]);

    function syncLocalPlaybackStateWithRemote() {
        const audio = audioRef.current;
        if (!audio || !isAudioReadyRef.current || !playingCollectionSong) return;

        if (isThisDeviceActive && isPlaybackActive) {
            void tryPlay(audio);
        } else {
            audio.pause();
        }
    }
    useEffect(syncLocalPlaybackStateWithRemote, [isPlaybackActive, isThisDeviceActive]);

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

        // TODO: probably remove since with introduction of shakapackager short tracks behave correctly
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

    return { handleLoadedMetadata, handleTimeUpdate, handleOnEnded, isMutedFallback, unmute };
}
