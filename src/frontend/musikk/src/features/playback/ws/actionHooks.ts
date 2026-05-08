import { ThisDevice } from "@/features/playback/hooks/useCurrentDevice.ts";
import { useWSClient } from "@/hooks/useWSClient.ts";
import { useCallback } from "react";

// TODO: one hook or multiple?
export function useRegisterDeviceAction() {
    const ws = useWSClient();
    const registerDeviceAction = useCallback(
        (device: ThisDevice) => {
            // volume is stored as a key in redis on be (with ttl),
            // so we use localStorage as the source of truth
            const payload: {
                device_id: string;
                name: string;
                volume?: number;
            } = { device_id: device.id, name: device.name };
            const saved = localStorage.getItem("deviceVolume");
            if (saved !== null) {
                const parsed = Number(saved);
                if (Number.isInteger(parsed) && parsed >= 0 && parsed <= 100) {
                    payload.volume = parsed;
                }
            }
            ws.send({ action: "device.register", payload });
        },
        [ws],
    );

    return registerDeviceAction;
}

export function useSetDeviceActiveAction() {
    const ws = useWSClient();
    const setDeviceActiveAction = useCallback(
        (device: ThisDevice) =>
            ws.send({
                action: "device.set_active",
                payload: { device_id: device.id },
            }),
        [ws],
    );
    return setDeviceActiveAction;
}

export function useSetDeviceVolumeAction() {
    const ws = useWSClient();
    const setDeviceVolumeAction = useCallback(
        (deviceId: string, volume: number) =>
            ws.send({
                action: "device.set_volume",
                payload: { device_id: deviceId, volume },
            }),
        [ws],
    );
    return setDeviceVolumeAction;
}

export function usePlaybackActions() {
    const ws = useWSClient();
    const activatePlaybackAction = useCallback(
        () =>
            ws.send({
                action: "playback.activate",
                payload: {},
            }),
        [ws],
    );
    const stopPlaybackAction = useCallback(
        () =>
            ws.send({
                action: "playback.stop",
                payload: {},
            }),
        [ws],
    );
    return { activatePlaybackAction, stopPlaybackAction };
}

export function useSeekAction() {
    const ws = useWSClient();
    return useCallback(
        (songPosMs: number, currentSongUuid: string | null) =>
            ws.send({
                action: "playback.seek",
                payload: { song_pos_ms: songPosMs, current_song_uuid: currentSongUuid },
            }),
        [ws],
    );
}

export function useSyncAction() {
    const ws = useWSClient();
    return useCallback(
        (songPosMs: number, currentSongUuid: string | null) =>
            ws.sendIfOpen({
                action: "playback.sync",
                payload: { song_pos_ms: songPosMs, current_song_uuid: currentSongUuid },
            }),
        [ws],
    );
}
