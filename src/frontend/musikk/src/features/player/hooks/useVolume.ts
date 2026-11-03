import { useDeviceList } from "@/features/playback/hooks/useDeviceList.ts";
import { usePlayerController } from "@/features/playback/hooks/usePlayerController.ts";
import { useSetDeviceVolumeAction } from "@/features/playback/ws/actionHooks.ts";
import { readDeviceVolume, writeDeviceVolume } from "@/features/player/deviceVolumeStorage.ts";
import { useCallback, useEffect, useRef, useState } from "react";

type SliderValue = number[];

export function useVolume() {
    const controller = usePlayerController();
    const { activeDevice } = useDeviceList();
    const setDeviceVolume = useSetDeviceVolumeAction();
    const [volume, setVolume] = useState(() => readDeviceVolume() ?? 100);
    const volumeBeforeMute = useRef(volume || 100);
    const remoteVolume = activeDevice?.volume;
    const [prevRemoteVolume, setPrevRemoteVolume] = useState<number | undefined>(undefined);

    // local changes
    useEffect(() => {
        controller.setUserVolume(volume / 100);
        writeDeviceVolume(volume);
    }, [controller, volume]);

    // when we get vol from ws
    if (remoteVolume !== prevRemoteVolume) {
        setPrevRemoteVolume(remoteVolume);
        if (remoteVolume !== undefined) {
            setVolume(remoteVolume);
        }
    }

    const handleVolumeCommit = useCallback(
        (value: SliderValue) => {
            if (activeDevice) {
                setDeviceVolume(activeDevice.id, value[0]);
            }
        },
        [activeDevice, setDeviceVolume],
    );

    const handleMuteToggle = useCallback(() => {
        if (volume > 0) {
            volumeBeforeMute.current = volume;
            setVolume(0);
            if (activeDevice) {
                setDeviceVolume(activeDevice.id, 0);
            }
        } else {
            const restored = volumeBeforeMute.current;
            setVolume(restored);
            if (activeDevice) {
                setDeviceVolume(activeDevice.id, restored);
            }
        }
    }, [volume, activeDevice, setDeviceVolume]);

    return { volume, setVolume, handleVolumeCommit, handleMuteToggle };
}
