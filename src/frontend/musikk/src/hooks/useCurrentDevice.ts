import { UUID } from "@/config/types.ts";
import { useCallback } from "react";

export interface ActiveDevice {
    uuid: UUID;
    name: string;
}

// register device on login, delete on page unload, register on page load?
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
        deviceID: localStorage.getItem("deviceID"),
        deviceName: localStorage.getItem("deviceName"),
        saveDevice,
        deleteDevice,
    };
}
