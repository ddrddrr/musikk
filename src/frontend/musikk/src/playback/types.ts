import { UUID } from "@/config/types.ts";

export interface IPlaybackDevice {
    uuid: UUID;
    name: string;
    is_active: boolean;
}

export interface IPlaybackState {
    active_device: IPlaybackDevice;
    devices: IPlaybackDevice[];
    is_playing: boolean;
}
