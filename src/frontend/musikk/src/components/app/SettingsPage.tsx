import { logout } from "@/auth/authentication.ts";
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

    const processLogout = useCallback(async () => {
        if (Cookies.get("csrftoken")) Cookies.remove("csrftoken");
        if (deviceID) deleteDeviceMutation.mutate(deviceID);
        await logout();
        navigate("/login");
    }, [deleteDeviceMutation, deviceID, navigate]);

    return (
        <div className="min-h-screen bg-red-600 flex items-center justify-center p-8">
            <Button onClick={processLogout} variant="ghost" size="lg" className="text-lg border-2 border-black">
                Logout
            </Button>
        </div>
    );
}
