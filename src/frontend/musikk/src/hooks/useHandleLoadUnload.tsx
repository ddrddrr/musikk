import { PlaybackURLs } from "@/config/endpoints.ts";
import { useCurrentDevice } from "@/hooks/useCurrentDevice.ts";
import { useRegisterPDMutation } from "@/playback/mutations.ts";
import Cookies from "js-cookie";
import { useEffect, useRef } from "react";

export function useHandleLoadUnload() {
    const hasRegistered = useRef(false); // only use in dev!
    const registerPDMutation = useRegisterPDMutation();
    const { deviceID, saveDevice, deleteDevice } = useCurrentDevice();

    useEffect(() => {
        const register = async () => {
            if (!hasRegistered.current && !deviceID && Cookies.get("refresh")) {
                hasRegistered.current = true;
                const device = await registerPDMutation.mutateAsync();
                saveDevice(device);
            }
        };
        register();

        const unregister = async () => {
            const refresh = Cookies.get("refresh");
            console.log(deviceID);
            if (deviceID && refresh) {
                navigator.sendBeacon(
                    PlaybackURLs.deleteDevice(deviceID),
                    JSON.stringify({
                        token: refresh,
                        uuid: deviceID,
                    }),
                );
                deleteDevice();
                console.log("deleted", deviceID);
            }
        };
        window.addEventListener("beforeunload", unregister);
        return () => {
            window.removeEventListener("beforeunload", unregister);
        };
    }, [deviceID, saveDevice]);
}
