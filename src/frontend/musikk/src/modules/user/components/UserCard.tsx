import { useUserUUID } from "@/modules/auth/hooks/useUserUUID.ts";
import { Card, CardContent } from "@/modules/ui/card.tsx";
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
} from "@/modules/ui/context-menu.tsx";
import { useFollowUserMutation, useUnfollowUserMutation } from "@/modules/user/mutations.tsx";
import { UserConnectionsContext } from "@/modules/user/providers/userConnectionsContext.tsx";
import { IUser } from "@/modules/user/types.ts";
import { MoreHorizontal, Smile } from "lucide-react";
import { useContext } from "react";
import { useNavigate } from "react-router-dom";

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
    const followUserMutation = useFollowUserMutation();
    const unfollowUserMutation = useUnfollowUserMutation();
    const myUuid = useUserUUID();
    const { followed } = useContext(UserConnectionsContext);

    const styles = sizeStyles[size];
    const { avatar, display_name } = user;

    function handleOnClick(u: IUser) {
        if (onClick) {
            onClick(u);
        } else {
            navigate(`/users/${u.uuid}`);
        }
    }

    const isFollowing = followed.map((f) => f.uuid).includes(user.uuid);

    function handleToggleFollow() {
        if (isFollowing) {
            unfollowUserMutation.mutate(user.uuid);
        } else {
            followUserMutation.mutate(user.uuid);
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
            {!!myUuid && user.uuid !== myUuid && (
                <ContextMenuContent panel="card" className="w-48">
                    <ContextMenuItem onSelect={handleToggleFollow}>
                        <MoreHorizontal className="w-4 h-4 mr-2" />
                        {isFollowing ? "Unfollow" : "Follow"}
                    </ContextMenuItem>
                </ContextMenuContent>
            )}
        </ContextMenu>
    );
}
