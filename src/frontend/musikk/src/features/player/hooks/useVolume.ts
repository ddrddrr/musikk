import { useDeviceList } from "@/features/playback/hooks/useDeviceList.ts";
import { useSetDeviceVolumeAction } from "@/features/playback/ws/actionHooks.ts";
import { useCallback, useEffect, useRef, useState } from "react";

type SliderValue = number[];

interface UseVolumeOptions {
    setUserVolume: (value: number) => void;
}

export function useVolume({ setUserVolume }: UseVolumeOptions) {
    const { activeDevice } = useDeviceList();
    const setDeviceVolume = useSetDeviceVolumeAction();
    const [volume, setVolume] = useState(() => {
        const saved = localStorage.getItem("deviceVolume");
        return saved !== null ? Number(saved) : 100;
    });
    const volumeBeforeMute = useRef(volume || 100);

    // local changes
    useEffect(() => {
        setUserVolume(volume / 100);
        localStorage.setItem("deviceVolume", String(volume));
    }, [volume, setUserVolume]);

    // when we get vol from ws
    useEffect(() => {
        if (!activeDevice) return;
        if (activeDevice.volume !== volume) {
            setVolume(activeDevice.volume);
        }
    }, [activeDevice?.volume]);

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
