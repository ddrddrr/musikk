import { DeviceListContext } from "@/modules/playback/providers/deviceListContext";
import { useContext } from "react";

export function useDeviceList() {
    const context = useContext(DeviceListContext);
    if (context === undefined) {
        throw new Error("useDeviceListContext must be used within a DeviceListProvider");
    }
    return context;
}
