import { api_client } from "@/api/axiosConf.ts";
import { NotificationURLs, UserURLs } from "@/api/endpoints.ts";
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

export function useFriendRequestMutation() {
    return useMutation({
        mutationFn: async (receiverUUID: UUID) => {
            const res = await api_client.post(NotificationURLs.friendRequestCreate(receiverUUID));
            return res.data;
        },
    });
}

interface AddToFriendsParams {
    userUUID: UUID;
    senderUUID: UUID;
}
// TODO: remove all down
export function useAddToFriendsMutation() {
    return useMutation({
        mutationFn: async ({ userUUID, senderUUID }: AddToFriendsParams) => {
            return await api_client.post(UserURLs.userFriendsAccept(userUUID, senderUUID));
        },
    });
}

export function useDeleteFriendMutation() {
    return useMutation({
        mutationFn: async ({ userUUID, senderUUID }: AddToFriendsParams) => {
            return await api_client.delete(UserURLs.userFriendsDelete(userUUID, senderUUID));
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

export function useFollowArtistMutation() {
    return useMutation({
        mutationFn: async (artistUUID: UUID) => {
            return await api_client.post(UserURLs.followArtist(artistUUID));
        },
    });
}

export function useRemoveFollowedArtistMutation() {
    return useMutation({
        mutationFn: async (artistUUID: UUID) => {
            return await api_client.delete(UserURLs.removeFollowedArtist(artistUUID));
        },
    });
}
