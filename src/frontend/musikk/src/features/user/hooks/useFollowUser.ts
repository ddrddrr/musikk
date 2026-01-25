import { useFollowUserMutation, useUnfollowUserMutation } from "@/features/user/mutations.tsx";
import { UserConnectionsContext } from "@/features/user/providers/userConnectionsContext.tsx";
import { useContext } from "react";

export function useFollowUser(userUUID: string | undefined) {
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
        } catch (error) {
            console.error("Error following/unfollowing user:", error);
        }
    };

    return {
        isFollowing,
        toggleFollow,
        isLoading: followMutation.isPending || unfollowMutation.isPending,
    };
}
