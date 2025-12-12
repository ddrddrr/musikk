import { IPlaybackDevice } from "@/modules/playback/types.ts";
import { useSetDeviceActiveAction } from "@/modules/playback/ws/actionHooks.ts";

export function useHandleSwitchDevice() {
    const setDeviceActiveAction = useSetDeviceActiveAction();
    function handleSwitchDevice(device: IPlaybackDevice) {
        const audio = document.querySelector("audio");
        if (audio) {
            try {
                audio.pause();
            } catch (error) {
                console.error(error);
            }
        }
        setDeviceActiveAction(device);
    }

    return handleSwitchDevice;
}
