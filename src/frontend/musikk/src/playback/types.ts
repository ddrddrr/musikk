import { UUID } from "@/config/types.ts";

export interface IPlaybackDevice {
    uuid: UUID;
    is_active: boolean;
}

export interface IPlaybackState {
    active_device: IPlaybackDevice;
    is_playing: boolean;
}
