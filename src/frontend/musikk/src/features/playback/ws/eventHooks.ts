import { useDeviceList } from "@/features/playback/hooks/useDeviceList.ts";
import { PlaybackContext } from "@/features/playback/providers/playbackContext.ts";
import { IPlaybackDevice } from "@/features/playback/types.ts";
import { useWSClient } from "@/hooks/useWSClient.ts";
import { useContext, useEffect } from "react";

interface DeviceListPayload {
    devices: IPlaybackDevice[];
}
export function useDeviceListEvent() {
    const ws = useWSClient();
    const { setDeviceList } = useDeviceList();

    useEffect(() => {
        return ws.subscribe("device.list", (payload: DeviceListPayload) => setDeviceList(payload.devices));
    }, [ws, setDeviceList]);
}

interface PlaybackChangeEvent {
    playback: boolean;
}
export function usePlaybackChangeEvent() {
    const ws = useWSClient();
    const { setIsPlaybackActive } = useContext(PlaybackContext);

    useEffect(() => {
        return ws.subscribe("playback.change", (payload: PlaybackChangeEvent) => {
            if (setIsPlaybackActive) {
                setIsPlaybackActive(payload.playback);
            }
        });
    }, [ws, setIsPlaybackActive]);
}
