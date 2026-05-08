import { getErrorDetail } from "@/api/errorUtils.ts";
import { useUserUUID } from "@/features/auth/hooks/useUserUUID.ts";
import { useFollowUserMutation, useUnfollowUserMutation } from "@/features/user/api/mutations.ts";
import { userKeys } from "@/features/user/api/queryKeys.ts";
import { UserConnectionsContext } from "@/features/user/providers/userConnectionsContext.tsx";
import { useQueryClient } from "@tanstack/react-query";
import { useContext } from "react";
import { toast } from "sonner";

export function useFollowUser(userUUID: string | undefined) {
    const queryClient = useQueryClient();
    const myUUID = useUserUUID();
    const followMutation = useFollowUserMutation();
    const unfollowMutation = useUnfollowUserMutation();
    const { followed } = useContext(UserConnectionsContext);

    const isFollowing = userUUID ? followed.some((u) => u.uuid === userUUID) : false;

    const toggleFollow = async () => {
        if (!userUUID) return;

        try {
            if (isFollowing) {
                await unfollowMutation.mutateAsync(userUUID);
            } else {
                await followMutation.mutateAsync(userUUID);
            }
            void queryClient.invalidateQueries({ queryKey: userKeys.followed(myUUID) });
            void queryClient.invalidateQueries({ queryKey: userKeys.friends(myUUID) });
            void queryClient.invalidateQueries({ queryKey: userKeys.followers(userUUID) });
        } catch (error) {
            toast.error(getErrorDetail(error, "Failed to update follow status"));
        }
    };

    return {
        isFollowing,
        toggleFollow,
        isLoading: followMutation.isPending || unfollowMutation.isPending,
    };
}
