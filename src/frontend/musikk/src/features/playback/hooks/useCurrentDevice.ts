import { getWebPlayerLabel } from "@/utils/getWebPlayerLabel";
import { randomID } from "@/utils/randomID.ts";
import { useState } from "react";

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

    return device;
}
