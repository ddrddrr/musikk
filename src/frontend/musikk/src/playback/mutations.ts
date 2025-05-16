import { api } from "@/config/axiosConf.ts";
import { PlaybackURLs } from "@/config/endpoints.ts";
import { UUID } from "@/config/types.ts";
import { IPlaybackDevice } from "@/playback/types.ts";
import { getWebPlayerLabel } from "@/utils/getWebPlayerLabel.ts";
import { useMutation } from "@tanstack/react-query";

export function useRegisterPDMutation() {
    return useMutation<IPlaybackDevice>({
        mutationFn: async () => {
            const res = await api.post(PlaybackURLs.registerDevice, { name: getWebPlayerLabel() });
            return res.data;
        },
    });
}

export function useSetDeviceActiveMutation() {
    return useMutation({
        mutationFn: (deviceUUID: UUID) => {
            return api.post(PlaybackURLs.setDeviceActive(deviceUUID));
        },
    });
}

export function useDeletePDMutation() {
    return useMutation({
        mutationFn: (deviceUUID: UUID) => {
            return api.post(PlaybackURLs.deleteDevice(deviceUUID));
        },
    });
}

interface IPlaybackParams {
    isPlaying: boolean;
}

export function usePlaybackStateMutation() {
    return useMutation({
        mutationFn: ({ isPlaying }: IPlaybackParams) => {
            return api.post(PlaybackURLs.setState, { is_playing: isPlaying });
        },
    });
}
