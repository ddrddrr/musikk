import { useWSClient } from "@/hooks/useWSClient.ts";
import { useDeviceList } from "@/modules/playback/hooks/useDeviceList.ts";
import { usePlaybackState } from "@/modules/playback/hooks/usePlaybackState.ts";
import { IPlaybackDevice } from "@/modules/playback/types.ts";
import { useEffect } from "react";

interface DeviceListPayload {
    devices: IPlaybackDevice[];
}
export function useDeviceListEvent() {
    const ws = useWSClient();
    const { setDeviceList } = useDeviceList();

    useEffect(() => {
        ws.subscribe("device.list", (payload: DeviceListPayload) => setDeviceList(payload.devices));
    }, [ws, setDeviceList]);
}

interface PlaybackChangeEvent {
    playback: boolean;
}
export function usePlaybackChangeEvent() {
    const ws = useWSClient();
    const { setIsPlaying } = usePlaybackState();

    useEffect(() => {
        ws.subscribe("playback.change", (payload: PlaybackChangeEvent) =>
            setIsPlaying(payload.playback),
        );
    }, [ws, setIsPlaying]);
}
