import { api_client } from "@/api/axiosConf.ts";
import { FriendActivityURLs } from "@/api/endpoints.ts";
import { useUserUUID } from "@/features/auth/hooks/useUserUUID.ts";
import { Collection, CollectionSong } from "@/features/collections/types.ts";
import { friendActivityKeys } from "@/features/friend-activity/queryKeys.ts";
import { UserSong } from "@/features/friend-activity/types.ts";
import { useQuery } from "@tanstack/react-query";

export function useFriendsListeningQuery() {
    const userUUID = useUserUUID();
    return useQuery<UserSong[]>({
        queryKey: friendActivityKeys.listening(userUUID),
        queryFn: async () => {
            const res = await api_client.get(FriendActivityURLs.listeningToList);
            return res.data;
        },
        refetchInterval: 10_000, // 10s
    });
}

export function useFriendsLatestAddedQuery() {
    const userUUID = useUserUUID();
    return useQuery<{ collections: Collection[]; songs: CollectionSong[] }>({
        queryKey: friendActivityKeys.latestAdded(userUUID),
        queryFn: async () => {
            const res = await api_client.get(FriendActivityURLs.latestAddedList);
            return res.data;
        },
    });
}
