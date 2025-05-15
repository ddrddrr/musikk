import { Card, CardContent } from "@/components/ui/card";
import {
    useDeleteFriendMutation,
    useFollowArtistMutation,
    useFriendRequestMutation,
    useRemoveFollowedArtistMutation,
} from "@/components/user/mutations.tsx";
import { IUser } from "@/components/user/types.ts";
import { useUserUUID } from "@/hooks/useUserUUID.ts";
import { UserConnectionsContext } from "@/providers/userConnectionsContext.tsx";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@radix-ui/react-context-menu";
import { MoreHorizontal, Smile } from "lucide-react";
import { useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface UserCardProps {
    user: IUser;
    size?: "small" | "medium" | "big";
    onClick?: (u: IUser) => void;
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
    const currUserUUID = useUserUUID();
    const { friends, followed } = useContext(UserConnectionsContext);

    const styles = sizeStyles[size];
    const { avatar, display_name } = user;

    useEffect(() => {
        if (friendRequestMutation.isSuccess) {
            toast("Friend request sent.");
        }
    }, [friendRequestMutation.isSuccess]);

    function handleOnClick(u: IUser) {
        if (onClick) {
            onClick(u);
        } else {
            navigate(`/users/${u.uuid}`);
        }
    }

    const isFriend = user.role === "streaminguser" && friends.map((f) => f.uuid).includes(user.uuid);
    const isFollowed = user.role === "artist" && followed.map((f) => f.uuid).includes(user.uuid);

    return (
        <ContextMenu>
            <ContextMenuTrigger asChild>
                <Card
                    onClick={() => handleOnClick(user)}
                    className={`py-0 cursor-pointer border-2 border-black rounded-sm overflow-hidden bg-gray-50 ${styles.card}`}
                >
                    <CardContent className="p-0 flex flex-col">
                        <div className={`${styles.avatarWrapper} bg-gray-200`}>
                            {avatar ? (
                                <img src={avatar} alt={display_name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <Smile className={`${styles.icon}`} />
                                </div>
                            )}
                        </div>
                        <div
                            className={`bg-gray-200 border-t-2 border-black text-center flex items-center justify-center ${styles.padding}`}
                        >
                            <p className={`font-bold truncate w-full ${styles.name}`}>{display_name}</p>
                        </div>
                    </CardContent>
                </Card>
            </ContextMenuTrigger>
            {user.uuid !== currUserUUID && user.role === "streaminguser" && (
                <ContextMenuContent className="w-48 bg-white rounded-sm border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] py-1">
                    <ContextMenuItem
                        className="flex items-center px-3 py-2 text-sm text-black hover:bg-gray-100 transition-colors"
                        onSelect={() =>
                            isFriend
                                ? deleteFriendMutation.mutate(currUserUUID, user.uuid)
                                : friendRequestMutation.mutate(user.uuid)
                        }
                    >
                        <MoreHorizontal className="w-4 h-4 mr-2" />
                        {isFriend ? "Remove from friends" : "Send friend request"}
                    </ContextMenuItem>
                </ContextMenuContent>
            )}
            {user.uuid !== currUserUUID && user.role === "artist" && (
                <ContextMenuContent className="w-48 bg-white rounded-sm border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] py-1">
                    <ContextMenuItem
                        className="flex items-center px-3 py-2 text-sm text-black hover:bg-gray-100 transition-colors"
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
