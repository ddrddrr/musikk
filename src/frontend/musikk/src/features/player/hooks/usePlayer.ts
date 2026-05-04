import { PlaybackContext } from "@/features/playback/providers/playbackContext.ts";
import { useTickAction } from "@/features/playback/ws/actionHooks.ts";
import { useQueueNext } from "@/features/song-queue/hooks/useQueueAPI.ts";
import { useWSClient } from "@/hooks/useWSClient.ts";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import shaka from "shaka-player";

const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

interface UsePlayerOptions {
    audioRef: React.RefObject<HTMLAudioElement | null>;
    ensureAudioPipeline: () => void;
    fadeIn: (durationMs?: number) => void;
    fadeOut: (durationMs?: number) => Promise<void>;
    onDurationChange?: (duration: number) => void;
    onTimeUpdate?: (currentTime: number) => void;
}

interface UsePlayerReturn {
    handleLoadedMetadata: () => void;
    handleTimeUpdate: () => void;
    handleOnEnded: () => void;
    isMutedFallback: boolean;
    unmute: () => Promise<void>;
}

interface PlaybackSeekPayload {
    position: number;
    collection_song_uuid: string | null;
}

export function usePlayer({
    audioRef,
    ensureAudioPipeline,
    fadeIn,
    fadeOut,
    onDurationChange,
    onTimeUpdate,
}: UsePlayerOptions): UsePlayerReturn {
    const { isThisDeviceActive, isPlaybackActive, playingCollectionSong, getCurrentTime } =
        useContext(PlaybackContext);
    const ws = useWSClient();
    const sendTick = useTickAction();
    const nextMutation = useQueueNext();
    const playerRef = useRef<shaka.Player | null>(null);
    const isAudioReadyRef = useRef(false);
    const [isMutedFallback, setIsMutedFallback] = useState(false);

    const isPlaybackActiveRef = useRef(isPlaybackActive);
    isPlaybackActiveRef.current = isPlaybackActive;
    const isThisDeviceActiveRef = useRef(isThisDeviceActive);
    isThisDeviceActiveRef.current = isThisDeviceActive;
    const playingUUIDRef = useRef<string | undefined>(playingCollectionSong?.uuid);
    playingUUIDRef.current = playingCollectionSong?.uuid;

    // TODO: split by OS not browser (ios -> m3u8, otherwise mpd)
    const url = useMemo(() => {
        if (!playingCollectionSong) return undefined;
        return isSafari ? playingCollectionSong.song.m3u8 : playingCollectionSong.song.mpd;
    }, [playingCollectionSong, isSafari]);

    async function tryPlay(audio: HTMLAudioElement) {
        try {
            await fadeOut(0);
            await audio.play();
            if (isMutedFallback) setIsMutedFallback(false);
            fadeIn();
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
                    // dont fadeIn here since audio is muted, and unmute() does the
                    // anti-pop fade for audio.muted=false
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

    async function unmute() {
        const audio = audioRef.current;
        if (!audio) return;
        // unmute click is the user gesture that lets us go over the autoplay policy
        // and build the AudioContext
        ensureAudioPipeline();
        await fadeOut(0);
        audio.muted = false;
        fadeIn();
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

            await fadeOut();
            if (cancelled) return;
            audio.pause();

            if (url && isThisDeviceActiveRef.current) {
                try {
                    await player.attach(audio);
                    if (cancelled) return;
                    await player.load(url);
                    if (cancelled) return;
                    isAudioReadyRef.current = true;

                    // resume from the broadcasted position when becoming active mid-playback
                    // skip if 0 (load already sets to 0) or > max duration
                    const resumeAt = getCurrentTime();
                    if (resumeAt > 0 && (!audio.duration || resumeAt < audio.duration)) {
                        audio.currentTime = resumeAt;
                    }

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

        let cancelled = false;
        const apply = async () => {
            if (isThisDeviceActive && isPlaybackActive) {
                void tryPlay(audio);
            } else {
                await fadeOut();
                if (cancelled) return;
                audio.pause();
            }
        };
        void apply();
        return () => {
            cancelled = true;
        };
    }
    useEffect(syncLocalPlaybackStateWithRemote, [isPlaybackActive, isThisDeviceActive]);

    function subToSeekWSEvent() {
        // needed only for active devices to update the curr audio time
        // (playback provider's seek/tick events update the non-active devices)
        return ws.subscribe("playback.seek", (payload: PlaybackSeekPayload) => {
            if (!isThisDeviceActiveRef.current || !isAudioReadyRef.current) return;
            if (payload.collection_song_uuid !== playingUUIDRef.current) {
                return;
            }
            const audio = audioRef.current;
            if (!audio) return;
            void (async () => {
                await fadeOut();
                audio.currentTime = payload.position;
                fadeIn();
            })();
        });
    }
    useEffect(subToSeekWSEvent, [ws]);

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
        if (!audio || !isAudioReadyRef.current) return;

        onTimeUpdate?.(audio.currentTime);

        if (isThisDeviceActiveRef.current && isPlaybackActiveRef.current) {
            sendTick(audio.currentTime, playingUUIDRef.current ?? null);
        }

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
