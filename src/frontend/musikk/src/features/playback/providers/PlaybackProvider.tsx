import { CollectionSong } from "@/features/collections/types.ts";
import { useCurrentDevice } from "@/features/playback/hooks/useCurrentDevice.ts";
import { useDeviceList } from "@/features/playback/hooks/useDeviceList.ts";
import {
    PlaybackContext,
    PlaybackTimeContext,
} from "@/features/playback/providers/playbackContext.ts";
import { useSeekAction } from "@/features/playback/ws/actionHooks.ts";
import { useQueue } from "@/features/song-queue/hooks/useQueueAPI.ts";
import { useWSClient } from "@/hooks/useWSClient.ts";
import { WSClient } from "@/ws/client";
import { ReactNode, RefObject, useCallback, useEffect, useMemo, useRef, useState } from "react";

interface PlaybackProviderProps {
    children: ReactNode;
}

interface PositionEventPayload {
    position: number;
    collection_song_uuid: string | null;
}

interface PlaybackSnapshotPayload {
    is_playback_active: boolean;
    position: number | null;
    current_song: CollectionSong | null;
}

type CurrAudioTimePos = { currTimePos: number; lastUpdateAt: number };

const AudioTimePosUpdateInterval = 250;

export function PlaybackProvider({ children }: PlaybackProviderProps) {
    const { error: queueError, refetch: queueRefetch } = useQueue();
    const device = useCurrentDevice();
    const { activeDevice } = useDeviceList();
    const ws = useWSClient();
    const seekAction = useSeekAction();
    const [isPlaybackActive, setIsPlaybackActive] = useState(false);
    const [currentSong, setCurrentSong] = useState<CollectionSong | null>(null);
    const [currentTime, setCurrentTime] = useState(0);
    const [totalDuration, setTotalDuration] = useState(0);
    const playingCollectionSong = currentSong ?? undefined;
    const isThisDeviceActive = !!device.id && device.id === activeDevice?.id;

    const playingUUIDRef = useRef<string | undefined>(playingCollectionSong?.uuid);
    playingUUIDRef.current = playingCollectionSong?.uuid;
    const audioTimePosRef = useRef<CurrAudioTimePos | null>(null);
    const currentTimeRef = useRef(currentTime);
    currentTimeRef.current = currentTime;
    const getCurrentTime = useCallback(() => currentTimeRef.current, []);

    useEffect(
        () => subToAudioTimePosWSEvents(ws, playingUUIDRef, audioTimePosRef, setCurrentTime),
        [ws],
    );

    useEffect(
        () =>
            subToPlaybackSnapshotWSEvent(
                ws,
                setIsPlaybackActive,
                setCurrentSong,
                audioTimePosRef,
                setCurrentTime,
            ),
        [ws],
    );

    useEffect(() => {
        resetPositionForNewSong(setCurrentTime, audioTimePosRef);
    }, [playingCollectionSong?.uuid]);

    useEffect(() => {
        // active device gets duration from the audio elem
        // inactive devices fall back to song metadata (as no actual song is loaded)
        if (isThisDeviceActive) return;
        const songDuration = playingCollectionSong?.song.duration_ms;
        setTotalDuration(songDuration ? songDuration / 1000 : 0);
    }, [isThisDeviceActive, playingCollectionSong?.song.duration_ms]);

    useEffect(() => {
        // be sends updates in an interval (e.g. every 3s)
        // so we need to update the time pos manually between the events
        if (isThisDeviceActive || !isPlaybackActive) return;
        return handleAudioTimePosOnInactiveDevice(audioTimePosRef, setCurrentTime);
    }, [isThisDeviceActive, isPlaybackActive]);

    const seek = useCallback(
        (position: number) => {
            seekAction(position, playingUUIDRef.current ?? null);
            audioTimePosRef.current = { currTimePos: position, lastUpdateAt: performance.now() };
            setCurrentTime(position);
        },
        [seekAction],
    );

    const playbackState = useMemo(
        () => ({
            thisDevice: device,
            isThisDeviceActive,
            isPlaybackActive,
            setIsPlaybackActive,
            playingCollectionSong,
            queueError: queueError ?? null,
            queueRefetch: () => void queueRefetch(),
            getCurrentTime,
            setCurrentTime,
            totalDuration,
            setTotalDuration,
            seek,
        }),
        [
            device,
            isThisDeviceActive,
            isPlaybackActive,
            playingCollectionSong,
            queueError,
            queueRefetch,
            getCurrentTime,
            totalDuration,
            seek,
        ],
    );

    // currentTime updates 4x/sec, the trick with useMemo and a sep provider
    // keeps components that use playbackState from re-rendering as frequently
    // (the ref for the value of PlaybackContext do not change --> no re-render)
    const currTime = useMemo(() => ({ currentTime }), [currentTime]);

    return (
        <PlaybackContext value={playbackState}>
            <PlaybackTimeContext value={currTime}>{children}</PlaybackTimeContext>
        </PlaybackContext>
    );
}

function resetPositionForNewSong(
    setCurrentTime: (n: number) => void,
    audioTimePosRef: RefObject<CurrAudioTimePos | null>,
): void {
    setCurrentTime(0);
    audioTimePosRef.current = null;
}

function subToPlaybackSnapshotWSEvent(
    ws: WSClient,
    setIsPlaybackActive: (b: boolean) => void,
    setCurrentSong: (s: CollectionSong | null) => void,
    audioTimePosRef: RefObject<CurrAudioTimePos | null>,
    setCurrentTime: (n: number) => void,
): () => void {
    return ws.subscribe("playback.snapshot", (payload: PlaybackSnapshotPayload) => {
        setIsPlaybackActive(payload.is_playback_active);
        setCurrentSong(payload.current_song);
        if (payload.position !== null) {
            audioTimePosRef.current = {
                currTimePos: payload.position,
                lastUpdateAt: performance.now(),
            };
            setCurrentTime(payload.position);
        }
    });
}

function subToAudioTimePosWSEvents(
    ws: WSClient,
    playingUUIDRef: RefObject<string | undefined>,
    audioTimePosRef: RefObject<CurrAudioTimePos | null>,
    setCurrentTime: (n: number) => void,
): () => void {
    const updateAudioTimePos = (payload: PositionEventPayload) => {
        // if the queue isn't loaded yet we don't know the current song so take the snapshot
        // resetPositionForNewSong will remove it later if the song turns out to be different
        if (
            playingUUIDRef.current !== undefined &&
            payload.collection_song_uuid !== playingUUIDRef.current
        ) {
            return;
        }
        audioTimePosRef.current = {
            currTimePos: payload.position,
            lastUpdateAt: performance.now(),
        };
        setCurrentTime(payload.position);
    };
    const unsubTick = ws.subscribe("playback.tick", updateAudioTimePos);
    const unsubSeek = ws.subscribe("playback.seek", updateAudioTimePos);
    return () => {
        unsubTick();
        unsubSeek();
    };
}

function handleAudioTimePosOnInactiveDevice(
    audioTimePosRef: RefObject<CurrAudioTimePos | null>,
    setCurrentTime: (n: number) => void,
): () => void {
    audioTimePosRef.current = null;
    const id = window.setInterval(() => {
        const a = audioTimePosRef.current;
        if (!a) return;
        setCurrentTime(a.currTimePos + (performance.now() - a.lastUpdateAt) / 1000);
    }, AudioTimePosUpdateInterval);
    return () => window.clearInterval(id);
}
