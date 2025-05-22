import { Button } from "@/components/ui/button";
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

    const logout = useCallback(() => {
        if (Cookies.get("access")) Cookies.remove("access");
        if (Cookies.get("refresh")) Cookies.remove("refresh");
        if (deviceID) deleteDeviceMutation.mutate(deviceID);
        navigate("/login");
    }, [deleteDeviceMutation, deviceID, navigate]);

    return (
        <div className="min-h-screen bg-red-600 flex items-center justify-center p-8">
            <Button
                onClick={logout}
                className="text-lg px-6 py-3 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            >
                Logout
            </Button>
        </div>
    );
}
