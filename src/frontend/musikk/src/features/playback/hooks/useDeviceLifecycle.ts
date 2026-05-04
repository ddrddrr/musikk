import { useEffect } from "react";
import { useDeviceHeartbeatAction, useRegisterDeviceAction } from "../ws/actionHooks.ts";
import { ThisDevice, useCurrentDevice } from "./useCurrentDevice.ts";

const HEARTBEAT_INTERVAL_MS = 3000;

type DeviceAction = (device: ThisDevice) => void;

function startHeartbeat(device: ThisDevice, send: DeviceAction): () => void {
    const intervalId = setInterval(() => send(device), HEARTBEAT_INTERVAL_MS);
    return () => clearInterval(intervalId);
}

// On return-to-foreground the device may have been evicted from Redis (browser
// timer throttling on hidden silent tabs vs. the device TTL). Re-registering
// is idempotent and brings the device back; an immediate heartbeat shortens
// the window where other devices see this one as missing.
function attachVisibilityRevival(
    device: ThisDevice,
    register: DeviceAction,
    heartbeat: DeviceAction,
): () => void {
    const onVisibilityChange = () => {
        if (document.visibilityState !== "visible") {
            return;
        }
        register(device);
        heartbeat(device);
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
}

export function useDeviceLifecycle() {
    const device = useCurrentDevice();
    const registerDevice = useRegisterDeviceAction();
    const sendHeartbeat = useDeviceHeartbeatAction();

    useEffect(() => {
        registerDevice(device);
    }, [registerDevice, device]);

    useEffect(() => startHeartbeat(device, sendHeartbeat), [device, sendHeartbeat]);

    useEffect(
        () => attachVisibilityRevival(device, registerDevice, sendHeartbeat),
        [device, registerDevice, sendHeartbeat],
    );
}
