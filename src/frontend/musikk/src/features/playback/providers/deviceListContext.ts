import { PlaybackDevice } from "@/features/playback/types.ts";
import { createContext } from "react";

interface DeviceListContextProps {
    deviceList: PlaybackDevice[];
    activeDevice: PlaybackDevice | null;
}
export const DeviceListContext = createContext<DeviceListContextProps | null>(null);
