import { api } from "@/config/axiosConf.ts";
import { UserURLs } from "@/config/endpoints.ts";
import { UUID } from "@/config/types.ts";
import { useMutation } from "@tanstack/react-query";

interface UserUpdateParams {
    userUUID: UUID;
    displayName?: string;
    bio?: string;
    avatar?: File;
}

export function useUserUpdateMutation() {
    return useMutation({
        mutationFn: ({ userUUID, displayName, bio, avatar }: UserUpdateParams) => {
            const formData = new FormData();
            if (displayName !== undefined) formData.append("displayName", displayName);
            if (bio !== undefined) formData.append("bio", bio);
            if (avatar) formData.append("avatar", avatar);

            return api.patch(UserURLs.userUpdate(userUUID), formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
        },
    });
}
