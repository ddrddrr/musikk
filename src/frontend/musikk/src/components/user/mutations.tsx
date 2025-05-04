import { api } from "@/config/axiosConf.ts";
import { NotificationURLs, UserURLs } from "@/config/endpoints.ts";
import { UUID } from "@/config/types.ts";
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

            return api.patch(UserURLs.userUpdate(userUUID), formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
        },
    });
}

export function useFriendRequestMutation() {
    return useMutation({
        mutationFn: async (receiverUUID: UUID) => {
            const res = await api.post(NotificationURLs.friendRequestCreate(receiverUUID));
            return res.data;
        },
    });
}

export function useAddToFriendsMutation() {
    return useMutation({
        mutationFn: async (senderUUID: UUID) => {
            return await api.post(UserURLs.userFriendsAccept(senderUUID));
        },
    });
}
