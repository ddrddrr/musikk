import { ThisDevice } from "@/features/playback/hooks/useCurrentDevice.ts";
import { useWSClient } from "@/hooks/useWSClient.ts";
import { useCallback } from "react";

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
