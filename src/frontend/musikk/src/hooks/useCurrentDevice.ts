import { UUID } from "@/config/types.ts";
import { useCallback } from "react";

export interface ActiveDevice {
    uuid: UUID;
    name: string;
}

export function useCurrentDevice() {
    const saveDevice = useCallback(function saveDevice(device: ActiveDevice) {
        localStorage.setItem("deviceID", device.uuid);
        localStorage.setItem("deviceName", device.name);
    }, []);

    const deleteDevice = useCallback(function deleteDevice() {
        localStorage.removeItem("deviceID");
        localStorage.removeItem("deviceName");
    }, []);

    return {
        getDeviceID: () => localStorage.getItem("deviceID"),
        getDeviceName: () => localStorage.getItem("deviceName"),
        saveDevice,
        deleteDevice,
    };
}
