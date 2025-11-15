import { api } from "@/api/axiosConf.ts";
import { FriendActivityURLs } from "@/api/endpoints.ts";
import { UserSong } from "@/components/friend-activity/types.ts";
import { ISongCollection, ISongCollectionSong } from "@/components/song-collections/types.ts";
import { useUserUUID } from "@/components/user/hooks/useUserUUID.ts";
import { useQuery } from "@tanstack/react-query";

export function useFriendsListeningQuery() {
    const userUUID = useUserUUID();
    return useQuery<UserSong[]>({
        queryKey: ["friend-activity", "listening", userUUID],
        queryFn: async () => {
            const res = await api.get(FriendActivityURLs.listeningToList);
            return res.data;
        },
        refetchInterval: 30_000, // 30s
    });
}

export function useFriendsLatestAddedQuery() {
    const userUUID = useUserUUID();
    return useQuery<{ collections: ISongCollection[]; songs: ISongCollectionSong[] }>({
        queryKey: ["friend-activity", "latest-added", userUUID],
        queryFn: async () => {
            const res = await api.get(FriendActivityURLs.latestAddedList);
            return res.data;
        },
    });
}
