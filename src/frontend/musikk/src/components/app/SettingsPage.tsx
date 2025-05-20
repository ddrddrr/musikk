import { useCurrentDevice } from "@/hooks/useCurrentDevice.ts";
import { useDeletePDMutation } from "@/playback/mutations.ts";
import Cookies from "js-cookie";
import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

export function SettingsPage() {
    const navigate = useNavigate();
    const deleteDeviceMutation = useDeletePDMutation();
    const { getDeviceID } = useCurrentDevice();
    const deviceID = getDeviceID();
    const logout = useCallback(
        function logout() {
            if (Cookies.get("access")) {
                Cookies.remove("access");
            }
            if (Cookies.get("refresh")) {
                Cookies.remove("refresh");
            }
            if (deviceID) deleteDeviceMutation.mutate(deviceID);
            navigate("/login");
        },
        [deleteDeviceMutation, deviceID, navigate],
    );

    return (
        <>
            <button onClick={logout}>logout</button>
        </>
    );
}
