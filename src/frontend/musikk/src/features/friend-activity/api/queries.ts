import { api_client } from "@/api/axiosConf.ts";
import { useUserUUID } from "@/features/auth/hooks/useUserUUID.ts";
import { FriendActivityURLs } from "@/features/friend-activity/api/endpoints.ts";
import { friendActivityKeys } from "@/features/friend-activity/api/queryKeys.ts";
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
