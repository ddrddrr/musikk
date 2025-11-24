import { api_client } from "@/api/axiosConf.ts";
import { PlaybackURLs } from "@/api/endpoints.ts";
import { IPlaybackState } from "@/playback/types.ts";
import { useQuery } from "@tanstack/react-query";

export function usePlaybackRetrieveQuery() {
    return useQuery<IPlaybackState>({
        queryFn: async () => {
            const res = await api_client.get(PlaybackURLs.retrieve);
            return res.data;
        },
        queryKey: ["playback"],
    });
}
