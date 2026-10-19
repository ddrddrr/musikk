const DEVICE_VOLUME_KEY = "deviceVolume";
const MAX_VOLUME = 100;

export function readDeviceVolume(): number | undefined {
    const saved = localStorage.getItem(DEVICE_VOLUME_KEY);
    if (saved === null) return undefined;

    const volume = Number(saved);
    if (!Number.isInteger(volume) || volume < 0 || volume > MAX_VOLUME) return undefined;
    return volume;
}

export function writeDeviceVolume(volume: number): void {
    localStorage.setItem(DEVICE_VOLUME_KEY, String(volume));
}
