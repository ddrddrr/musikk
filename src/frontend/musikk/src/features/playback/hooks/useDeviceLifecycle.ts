import { useDeviceList } from "@/features/playback/hooks/useDeviceList.ts";
import { useEffect } from "react";
import {
    useDeviceHeartbeatAction,
    useRegisterDeviceAction,
    useSetDeviceActiveAction,
} from "../ws/actionHooks.ts";
import { useCurrentDevice } from "./useCurrentDevice.ts";

export function useDeviceLifecycle() {
    const { device } = useCurrentDevice();
    const { deviceList, activeDevice } = useDeviceList();
    const registerDevice = useRegisterDeviceAction();
    const sendHeartbeat = useDeviceHeartbeatAction();
    const setDeviceActiveAction = useSetDeviceActiveAction();

    useEffect(() => {
        registerDevice(device);
    }, [registerDevice]);

    useEffect(() => {
        if (
            activeDevice?.id !== device.id &&
            deviceList.length == 1 &&
            deviceList[0].id == device.id // just extra precausions
        ) {
            setDeviceActiveAction(device);
        }
    }, [setDeviceActiveAction, device, activeDevice, deviceList]);

    useEffect(() => {
        const intervalId = setInterval(() => {
            sendHeartbeat(device);
        }, 3000);

        return () => clearInterval(intervalId);
    }, [sendHeartbeat, device]);
}
