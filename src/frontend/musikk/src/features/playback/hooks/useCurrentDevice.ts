import { getWebPlayerLabel } from "@/utils/getWebPlayerLabel";
import { randomID } from "@/utils/randomID.ts";
import { useCallback, useMemo, useState } from "react";

export interface ThisDevice {
    id: string;
    name: string;
}

export function useCurrentDevice() {
    const [device] = useState<ThisDevice>(() => {
        const savedId = localStorage.getItem("deviceID");
        const savedName = localStorage.getItem("deviceName");

        if (savedId && savedName) {
            return { id: savedId, name: savedName };
        }

        const newDevice: ThisDevice = {
            id: randomID(),
            name: getWebPlayerLabel(),
        };

        localStorage.setItem("deviceID", newDevice.id);
        localStorage.setItem("deviceName", newDevice.name);

        return newDevice;
    });

    const getDeviceID = useCallback(() => device.id, [device.id]);
    const getDeviceName = useCallback(() => device.name, [device.name]);

    return useMemo(
        () => ({
            device,
            deviceId: device.id,
            deviceName: device.name,
            getDeviceID,
            getDeviceName,
        }),
        [device, getDeviceID, getDeviceName],
    );
}
