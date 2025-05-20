import { PlaybackURLs } from "@/config/endpoints.ts";
import { useCurrentDevice } from "@/hooks/useCurrentDevice.ts";
import { useRegisterPDMutation } from "@/playback/mutations.ts";
import { useQueryClient } from "@tanstack/react-query";
import Cookies from "js-cookie";
import { useEffect, useRef } from "react";

export function useHandleLoadUnload() {
    const hasRegistered = useRef(false); // only use in dev!
    const client = useQueryClient();
    const registerPDMutation = useRegisterPDMutation();
    const { getDeviceID, saveDevice, deleteDevice } = useCurrentDevice();
    const deviceID = getDeviceID();
    useEffect(() => {
        const register = async () => {
            if (!hasRegistered.current && !deviceID && Cookies.get("refresh")) {
                hasRegistered.current = true;
                try {
                    const device = await registerPDMutation.mutateAsync();
                    saveDevice(device);
                    client.fetchQuery({ queryKey: ["playback"] });
                } catch (err) {
                    console.error("Registration failed", err);
                }
            }
        };
        register();

        const unregister = async () => {
            const refresh = Cookies.get("refresh");
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
        window.addEventListener("unload", unregister);
        return () => {
            window.removeEventListener("unload", unregister);
        };
    }, [deviceID, saveDevice]);
}
