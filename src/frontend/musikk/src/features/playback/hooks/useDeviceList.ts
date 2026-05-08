import { DeviceListContext } from "@/features/playback/providers/deviceListContext";
import { useContext } from "react";

export function useDeviceList() {
    const context = useContext(DeviceListContext);
    if (context === undefined) {
        throw new Error("useDeviceList must be used within a DeviceListProvider");
    }
    return context;
}
