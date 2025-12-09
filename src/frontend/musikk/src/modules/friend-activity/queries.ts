import { api_client } from "@/api/axiosConf.ts";
import { FriendActivityURLs } from "@/api/endpoints.ts";
import { useUserUUID } from "@/modules/auth/hooks/useUserUUID.ts";
import { UserSong } from "@/modules/friend-activity/types.ts";
import { ICollection, ICollectionSong } from "@/modules/song-collections/types.ts";
import { useQuery } from "@tanstack/react-query";

export function useFriendsListeningQuery() {
    const userUUID = useUserUUID();
    return useQuery<UserSong[]>({
        queryKey: ["friend-activity", "listening", userUUID],
        queryFn: async () => {
            const res = await api_client.get(FriendActivityURLs.listeningToList);
            return res.data;
        },
        refetchInterval: 30_000, // 30s
    });
}

export function useFriendsLatestAddedQuery() {
    const userUUID = useUserUUID();
    return useQuery<{ collections: ICollection[]; songs: ICollectionSong[] }>({
        queryKey: ["friend-activity", "latest-added", userUUID],
        queryFn: async () => {
            const res = await api_client.get(FriendActivityURLs.latestAddedList);
            return res.data;
        },
    });
}
