import { api } from "@/config/axiosConf.ts";
import { PlaybackURLs } from "@/config/endpoints.ts";
import { IPlaybackState } from "@/playback/types.ts";
import { useQuery } from "@tanstack/react-query";

export function usePlaybackRetrieveQuery() {
    return useQuery<IPlaybackState>({
        queryFn: async () => {
            const res = await api.get(PlaybackURLs.retrieve);
            return res.data;
        },
        queryKey: ["playback"],
    });
}
