import { ThisDevice } from "@/features/playback/hooks/useCurrentDevice.ts";
import { useWSClient } from "@/hooks/useWSClient.ts";
import { useCallback } from "react";
import { useThrottledCallback } from "use-debounce";

const TICK_INTERVAL_MS = 1500;

// TODO: one hook or multiple?
export function useRegisterDeviceAction() {
    const ws = useWSClient();
    const registerDeviceAction = useCallback(
        (device: ThisDevice) =>
            ws.send({
                action: "device.register",
                payload: { device_id: device.id, name: device.name },
            }),
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

export function useDeviceHeartbeatAction() {
    const ws = useWSClient();
    const deviceHeartbeatAction = useCallback(
        (device: ThisDevice) =>
            ws.send({
                action: "device.heartbeat",
                payload: { device_id: device.id },
            }),
        [ws],
    );
    return deviceHeartbeatAction;
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
        (position: number, collectionSongUuid: string | null) =>
            ws.send({
                action: "playback.seek",
                payload: { position, collection_song_uuid: collectionSongUuid },
            }),
        [ws],
    );
}

export function useTickAction() {
    const ws = useWSClient();
    return useThrottledCallback(
        (position: number, collectionSongUuid: string | null) =>
            ws.send({
                action: "playback.tick",
                payload: { position, collection_song_uuid: collectionSongUuid },
            }),
        TICK_INTERVAL_MS,
    );
}
