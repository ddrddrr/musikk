import { THIS_DEVICE, ThisDevice } from "@/features/playback/thisDevice.ts";
import { useWSClient } from "@/hooks/useWSClient.ts";
import { WSClient } from "@/ws/client.ts";
import { useEffect } from "react";
import { useRegisterDeviceAction } from "../ws/actionHooks.ts";

type DeviceAction = (device: ThisDevice) => void;

// BE drops the device entry on disconnect (PING-timeout or clean close), so
// every fresh WS open must re-register, otherwise other tabs would never see
// this device after a network disconnect
function attachReregisterOnOpen(
    ws: WSClient,
    device: ThisDevice,
    register: DeviceAction,
): () => void {
    return ws.onOpen(() => register(device));
}

export function useDeviceLifecycle() {
    const ws = useWSClient();
    const registerDevice = useRegisterDeviceAction();

    useEffect(() => attachReregisterOnOpen(ws, THIS_DEVICE, registerDevice), [ws, registerDevice]);
}
