import { api_client } from "@/api/axiosConf.ts";
import { UUID } from "@/api/types.ts";
import { UserURLs } from "@/features/user/api/endpoints.ts";
import { userKeys } from "@/features/user/api/queryKeys.ts";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface UserUpdateParams {
    display_name?: string;
    bio?: string;
    avatar?: File;
}

export function useMeUpdateMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ display_name, bio, avatar }: UserUpdateParams) => {
            const formData = new FormData();
            if (display_name) formData.append("display_name", display_name);
            if (bio) formData.append("bio", bio);
            if (avatar) formData.append("avatar", avatar);

            return api_client.patch(UserURLs.meUpdate, formData);
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: userKeys.base });
        },
    });
}

export function useFollowUserMutation() {
    return useMutation({
        mutationFn: async (userUUID: UUID) => {
            return await api_client.post(UserURLs.followUser(userUUID));
        },
    });
}

export function useUnfollowUserMutation() {
    return useMutation({
        mutationFn: async (userUUID: UUID) => {
            return await api_client.delete(UserURLs.unfollowUser(userUUID));
        },
    });
}
