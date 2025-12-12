import { DeviceListContext } from "@/modules/playback/providers/deviceListContext.ts";
import { IPlaybackDevice } from "@/modules/playback/types.ts";
import { ReactNode, useMemo, useState } from "react";

interface DeviceListProviderProps {
    children: ReactNode;
}

export function DeviceListProvider({ children }: DeviceListProviderProps) {
    const [deviceList, setDeviceList] = useState<IPlaybackDevice[]>([]);

    const activeDevice = useMemo(
        () => deviceList.find((device) => device.is_active) ?? null,
        [deviceList],
    );

    const value = useMemo(
        () => ({
            deviceList,
            setDeviceList,
            activeDevice,
        }),
        [deviceList, activeDevice],
    );

    return <DeviceListContext value={value}>{children}</DeviceListContext>;
}
