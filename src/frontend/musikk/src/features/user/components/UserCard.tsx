import { useUserUUID } from "@/features/auth/hooks/useUserUUID.ts";
import { Card, CardContent } from "@/features/ui/card.tsx";
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
} from "@/features/ui/context-menu.tsx";
import { useFollowUser } from "@/features/user/hooks/useFollowUser.ts";
import { BaseUser } from "@/features/user/types.ts";
import { MoreHorizontal, Smile } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface UserCardProps {
    user: BaseUser;
    size?: "small" | "medium" | "big";
    onClick?: (u: BaseUser) => void;
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
    const myUuid = useUserUUID();
    const { isFollowing, toggleFollow } = useFollowUser(user.uuid);

    const styles = sizeStyles[size];
    const { avatar, display_name } = user;

    function handleOnClick(u: BaseUser) {
        if (onClick) {
            onClick(u);
        } else {
            void navigate(`/users/${u.uuid}`);
        }
    }

    return (
        <ContextMenu>
            <ContextMenuTrigger asChild>
                <Card
                    onClick={() => handleOnClick(user)}
                    variant="panel"
                    className={`cursor-pointer py-0 ${styles.card}`}
                >
                    <CardContent className="flex flex-col p-0">
                        <div className={`${styles.avatarWrapper} bg-gray-200`}>
                            {avatar ? (
                                <img
                                    src={avatar}
                                    alt={display_name}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center">
                                    <Smile className={`${styles.icon}`} />
                                </div>
                            )}
                        </div>
                        <div
                            className={`flex items-center justify-center border-t-2 border-black bg-gray-200 text-center ${styles.padding}`}
                        >
                            <p className={`w-full truncate font-bold ${styles.name}`}>
                                {display_name}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </ContextMenuTrigger>
            {!!myUuid && user.uuid !== myUuid && (
                <ContextMenuContent panel="card" className="w-48">
                    <ContextMenuItem onSelect={toggleFollow}>
                        <MoreHorizontal className="mr-2 h-4 w-4" />
                        {isFollowing ? "Unfollow" : "Follow"}
                    </ContextMenuItem>
                </ContextMenuContent>
            )}
        </ContextMenu>
    );
}
