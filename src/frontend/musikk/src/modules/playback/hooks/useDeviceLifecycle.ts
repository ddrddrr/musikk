import { useEffect } from "react";
import { useDeviceHeartbeatAction, useRegisterDeviceAction } from "../ws/actionHooks.ts";
import { useCurrentDevice } from "./useCurrentDevice.ts";

export function useDeviceLifecycle() {
    const { device } = useCurrentDevice();
    const registerDevice = useRegisterDeviceAction();
    const sendHeartbeat = useDeviceHeartbeatAction();

    useEffect(() => {
        registerDevice(device);
    }, [registerDevice]);

    useEffect(() => {
        const intervalId = setInterval(() => {
            sendHeartbeat(device);
        }, 3000);

        return () => clearInterval(intervalId);
    }, [sendHeartbeat, device]);
}
