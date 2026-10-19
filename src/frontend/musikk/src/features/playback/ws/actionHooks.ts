import { ThisDevice } from "@/features/playback/thisDevice.ts";
import {
    ActiveDeviceReportPayload,
    PlaybackSetPayload,
} from "@/features/playback/ws/playbackPayload.ts";
import { readDeviceVolume } from "@/features/player/deviceVolumeStorage.ts";
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
            const savedVolume = readDeviceVolume();
            if (savedVolume !== undefined) {
                payload.volume = savedVolume;
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
        (deviceId: string) =>
            ws.send({
                action: "device.set_active",
                payload: { device_id: deviceId },
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

export function useSetPlaybackAction() {
    const ws = useWSClient();
    return useCallback(
        (payload: PlaybackSetPayload) => ws.send({ action: "playback.set", payload }),
        [ws],
    );
}

export function useActiveDeviceReportAction() {
    const ws = useWSClient();
    // a queued report would already be stale when the connection reopens
    return useCallback(
        (payload: ActiveDeviceReportPayload) =>
            ws.sendIfOpen({ action: "playback.active-device-report", payload }),
        [ws],
    );
}
