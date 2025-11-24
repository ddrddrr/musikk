import { UUID } from "@/api/types.ts";
import { useCurrentDevice, ActiveDevice } from "@/hooks/useCurrentDevice.ts";
import { useDeletePDMutation, useRegisterPDMutation } from "@/playback/mutations.ts";
import { useCallback } from "react";

export function useDeviceManagement() {
    const { saveDevice: saveDeviceToStorage, deleteDevice: deleteDeviceFromStorage, getDeviceID } = useCurrentDevice();
    const registerPDMutation = useRegisterPDMutation();
    const deletePDMutation = useDeletePDMutation();

    const registerDevice = useCallback(async (): Promise<ActiveDevice> => {
        const device = await registerPDMutation.mutateAsync();
        const activeDevice: ActiveDevice = {
            uuid: device.uuid,
            name: device.name,
        };
        saveDeviceToStorage(activeDevice);
        return activeDevice;
    }, [registerPDMutation, saveDeviceToStorage]);

    const deleteDevice = useCallback(async (deviceID?: UUID | null): Promise<void> => {
        const idToDelete = deviceID ?? getDeviceID();
        if (idToDelete) {
            await deletePDMutation.mutateAsync(idToDelete);
        }
        deleteDeviceFromStorage();
    }, [deletePDMutation, deleteDeviceFromStorage, getDeviceID]);

    return {
        registerDevice,
        deleteDevice,
        isRegistering: registerPDMutation.isPending,
        isDeleting: deletePDMutation.isPending,
        registerError: registerPDMutation.error,
        deleteError: deletePDMutation.error,
    };
}
