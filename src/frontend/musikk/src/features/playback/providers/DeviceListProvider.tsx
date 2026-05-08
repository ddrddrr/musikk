import { DeviceListContext } from "@/features/playback/providers/deviceListContext.ts";
import { IPlaybackDevice } from "@/features/playback/types.ts";
import { useWSClient } from "@/hooks/useWSClient.ts";
import { ReactNode, useEffect, useMemo, useState } from "react";

interface DeviceListProviderProps {
    children: ReactNode;
}

interface DeviceListPayload {
    devices: IPlaybackDevice[];
}

export function DeviceListProvider({ children }: DeviceListProviderProps) {
    const ws = useWSClient();
    const [deviceList, setDeviceList] = useState<IPlaybackDevice[]>([]);

    useEffect(
        () =>
            ws.subscribe("device.list", (payload: DeviceListPayload) => {
                setDeviceList(payload.devices);
            }),
        [ws],
    );

    const activeDevice = useMemo(
        () => deviceList.find((device) => device.is_active) ?? null,
        [deviceList],
    );

    const value = useMemo(
        () => ({
            deviceList,
            activeDevice,
        }),
        [deviceList, activeDevice],
    );

    return <DeviceListContext value={value}>{children}</DeviceListContext>;
}
