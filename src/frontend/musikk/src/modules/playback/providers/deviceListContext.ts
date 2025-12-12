import { IPlaybackDevice } from "@/modules/playback/types.ts";
import { createContext } from "react";

interface DeviceListContextProps {
    deviceList: IPlaybackDevice[];
    setDeviceList: (devices: IPlaybackDevice[]) => void;
    activeDevice: IPlaybackDevice | null;
}
export const DeviceListContext = createContext<DeviceListContextProps | undefined>(undefined);
