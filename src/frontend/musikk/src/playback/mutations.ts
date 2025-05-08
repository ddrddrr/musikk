import { api } from "@/config/axiosConf.ts";
import { PlaybackURLs } from "@/config/endpoints.ts";
import { UUID } from "@/config/types.ts";
import { IPlaybackDevice } from "@/playback/types.ts";
import { useMutation } from "@tanstack/react-query";

export function useRegisterPlaybackDeviceMutation() {
    return useMutation<IPlaybackDevice>({
        mutationFn: async () => {
            const res = await api.post(PlaybackURLs.registerDevice);
            return res.data;
        },
    });
}

interface IPlaybackParams {
    deviceID: UUID;
}

export function usePlaybackActivateMutation() {
    return useMutation({
        mutationFn: ({ deviceID }: IPlaybackParams) => {
            return api.post(PlaybackURLs.activate, { active_device_uuid: deviceID });
        },
    });
}

export function usePlaybackStopMutation() {
    return useMutation({
        mutationFn: () => {
            return api.post(PlaybackURLs.stop);
        },
    });
}
