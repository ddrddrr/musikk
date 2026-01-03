import { useFollowUserMutation, useUnfollowUserMutation } from "@/features/user/mutations.tsx";
import { UserConnectionsContext } from "@/features/user/providers/userConnectionsContext.tsx";
import { useContext } from "react";

export function useFollowUser(userUuid: string | undefined) {
    const followMutation = useFollowUserMutation();
    const unfollowMutation = useUnfollowUserMutation();
    const { followed } = useContext(UserConnectionsContext);

    const isFollowing = userUuid ? followed.some((u) => u.uuid === userUuid) : false;

    const toggleFollow = async () => {
        if (!userUuid) return;

        try {
            if (isFollowing) {
                await unfollowMutation.mutateAsync(userUuid);
            } else {
                await followMutation.mutateAsync(userUuid);
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
