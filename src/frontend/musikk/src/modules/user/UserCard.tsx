import { useUserUUID } from "@/modules/auth/hooks/useUserUUID.ts";
import { Card, CardContent } from "@/modules/ui/card";
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
} from "@/modules/ui/context-menu";
import {
    useDeleteFriendMutation,
    useFollowArtistMutation,
    useFriendRequestMutation,
    useRemoveFollowedArtistMutation,
} from "@/modules/user/mutations.tsx";
import { IUserBaseProfile } from "@/modules/user/types.ts";
import { UserConnectionsContext } from "@/providers/userConnectionsContext.tsx";
import { MoreHorizontal, Smile } from "lucide-react";
import { useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface UserCardProps {
    user: IUserBaseProfile;
    size?: "small" | "medium" | "big";
    onClick?: (u: IUserBaseProfile) => void;
}

const sizeStyles = {
    small: {
        card: "w-24",
        avatarWrapper: "aspect-square",
        name: "text-sm",
        icon: "text-xl",
        padding: "py-2 px-1",
    },
    medium: {
        card: "w-40",
        avatarWrapper: "aspect-square",
        name: "text-base",
        icon: "text-2xl",
        padding: "py-2 px-2",
    },
    big: {
        card: "w-44",
        avatarWrapper: "aspect-square",
        name: "text-lg",
        icon: "text-3xl",
        padding: "py-3 px-3",
    },
};

export function UserCard({ user, size = "medium", onClick }: UserCardProps) {
    const navigate = useNavigate();
    const friendRequestMutation = useFriendRequestMutation();
    const deleteFriendMutation = useDeleteFriendMutation();
    const followArtistMutation = useFollowArtistMutation();
    const removeFollowedArtistMutation = useRemoveFollowedArtistMutation();
    const myUuid = useUserUUID();
    const { friends, followed } = useContext(UserConnectionsContext);

    const styles = sizeStyles[size];
    const { avatar, display_name } = user;

    useEffect(() => {
        if (friendRequestMutation.isSuccess) {
            toast("Friend request sent.");
        }
    }, [friendRequestMutation.isSuccess]);

    function handleOnClick(u: IUserBaseProfile) {
        if (onClick) {
            onClick(u);
        } else {
            navigate(`/users/${u.uuid}`);
        }
    }

    const isFriend =
        user.role === "streaminguser" && friends.map((f) => f.uuid).includes(user.uuid);
    const isFollowed = user.role === "artist" && followed.map((f) => f.uuid).includes(user.uuid);

    function handleToggleFriend() {
        if (!myUuid) return;
        if (isFriend) {
            deleteFriendMutation.mutate({ userUUID: myUuid, senderUUID: user.uuid });
        } else {
            friendRequestMutation.mutate(user.uuid);
        }
    }

    return (
        <ContextMenu>
            <ContextMenuTrigger asChild>
                <Card
                    onClick={() => handleOnClick(user)}
                    variant="panel"
                    size={size === "small" ? "sm" : size === "big" ? "lg" : "md"}
                    className={`py-0 cursor-pointer ${styles.card}`}
                >
                    <CardContent className="p-0 flex flex-col">
                        <div className={`${styles.avatarWrapper} bg-gray-200`}>
                            {avatar ? (
                                <img
                                    src={avatar}
                                    alt={display_name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <Smile className={`${styles.icon}`} />
                                </div>
                            )}
                        </div>
                        <div
                            className={`bg-gray-200 border-t-2 border-black text-center flex items-center justify-center ${styles.padding}`}
                        >
                            <p className={`font-bold truncate w-full ${styles.name}`}>
                                {display_name}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </ContextMenuTrigger>
            {!!myUuid && user.uuid !== myUuid && user.role === "streaminguser" && (
                <ContextMenuContent panel="card" className="w-48">
                    <ContextMenuItem onSelect={handleToggleFriend}>
                        <MoreHorizontal className="w-4 h-4 mr-2" />
                        {isFriend ? "Remove from friends" : "Send friend request"}
                    </ContextMenuItem>
                </ContextMenuContent>
            )}
            {user.uuid !== myUuid && user.role === "artist" && (
                <ContextMenuContent panel="card" className="w-48">
                    <ContextMenuItem
                        onSelect={() =>
                            isFollowed
                                ? removeFollowedArtistMutation.mutate(user.uuid)
                                : followArtistMutation.mutate(user.uuid)
                        }
                    >
                        <MoreHorizontal className="w-4 h-4 mr-2" />
                        {isFollowed ? "Unfollow" : "Follow"}
                    </ContextMenuItem>
                </ContextMenuContent>
            )}
        </ContextMenu>
    );
}
