import { useSetDeviceActiveMutation } from "@/playback/mutations.ts";
import { IPlaybackDevice } from "@/playback/types.ts";

export function useHandleSwitchDevice() {
    const setActiveDeviceMutation = useSetDeviceActiveMutation();

    function handleSwitchDevice(device: IPlaybackDevice) {
        const audio = document.querySelector("audio");
        if (audio) {
            try {
                audio.pause();
            } catch (error) {
                console.error(error);
            }
        }
        setActiveDeviceMutation.mutate(device.uuid);
    }

    return handleSwitchDevice;
}
