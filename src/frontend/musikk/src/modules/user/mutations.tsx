import { api_client } from "@/api/axiosConf.ts";
import { UserURLs } from "@/api/endpoints.ts";
import { UUID } from "@/api/types.ts";
import { useMutation } from "@tanstack/react-query";

interface UserUpdateParams {
    userUUID: UUID;
    display_name?: string;
    bio?: string;
    avatar?: File;
}

export function useUserUpdateMutation() {
    return useMutation({
        mutationFn: ({ userUUID, display_name, bio, avatar }: UserUpdateParams) => {
            const formData = new FormData();
            if (display_name !== undefined) formData.append("display_name", display_name);
            if (bio !== undefined) formData.append("bio", bio);
            if (avatar) formData.append("avatar", avatar);

            return api_client.patch(UserURLs.userUpdate(userUUID), formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
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
