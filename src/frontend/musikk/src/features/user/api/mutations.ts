import { api_client } from "@/api/axiosConf.ts";
import { UUID } from "@/api/types.ts";
import { UserURLs } from "@/features/user/api/endpoints.ts";
import { userKeys } from "@/features/user/api/queryKeys.ts";
import { BaseUser } from "@/features/user/types.ts";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface UserUpdateResponse {
    user: BaseUser;
}

interface UserUpdateParams {
    display_name?: string;
    bio?: string;
    avatar?: File;
}

export function useMeUpdateMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ display_name, bio, avatar }: UserUpdateParams) => {
            const formData = new FormData();
            if (display_name !== undefined) formData.append("display_name", display_name);
            if (bio !== undefined) formData.append("bio", bio);
            if (avatar !== undefined) formData.append("avatar", avatar);

            const res = await api_client.patch<UserUpdateResponse>(UserURLs.meUpdate, formData);
            return res.data;
        },
        onSuccess: ({ user }) => {
            void queryClient.invalidateQueries({ queryKey: userKeys.me() });
            void queryClient.invalidateQueries({ queryKey: userKeys.detail(user.uuid) });
        },
    });
}

export function useFollowUserMutation() {
    return useMutation({
        mutationFn: async (userUUID: UUID) => {
            await api_client.post<void>(UserURLs.followUser(userUUID));
        },
    });
}

export function useUnfollowUserMutation() {
    return useMutation({
        mutationFn: async (userUUID: UUID) => {
            await api_client.delete<void>(UserURLs.unfollowUser(userUUID));
        },
    });
}
