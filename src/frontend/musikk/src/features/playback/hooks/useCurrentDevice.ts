import { getWebPlayerLabel } from "@/utils/getWebPlayerLabel";
import { randomID } from "@/utils/randomID.ts";
import { useState } from "react";

export interface ThisDevice {
    id: string;
    name: string;
}

export function useCurrentDevice() {
    const [device] = useState<ThisDevice>(() => {
        const savedId = sessionStorage.getItem("deviceID");
        if (savedId) {
            return { id: savedId, name: getWebPlayerLabel() };
        }

        const newDevice: ThisDevice = {
            id: randomID(),
            name: getWebPlayerLabel(),
        };
        sessionStorage.setItem("deviceID", newDevice.id);
        return newDevice;
    });

    return device;
}
