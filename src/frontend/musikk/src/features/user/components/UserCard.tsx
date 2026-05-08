import { useUserUUID } from "@/features/auth/hooks/useUserUUID.ts";
import { type CardSize, cardTitleVariants } from "@/features/common/card-variants.ts";
import { MediaThumbnail } from "@/features/common/MediaThumbnail.tsx";
import { Card, CardContent } from "@/features/ui/card.tsx";
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
} from "@/features/ui/context-menu.tsx";
import { useFollowUser } from "@/features/user/hooks/useFollowUser.ts";
import { BaseUser } from "@/features/user/types.ts";
import { cva } from "class-variance-authority";
import { MoreHorizontal, Smile } from "lucide-react";
import { useNavigate } from "react-router-dom";

type UserCardProps = {
    user: BaseUser;
    size?: CardSize;
    onClick?: (u: BaseUser) => void;
};

const userCardWidthVariants = cva("", {
    variants: {
        size: {
            small: "w-24",
            medium: "w-40",
            big: "w-44",
        },
    },
    defaultVariants: { size: "medium" },
});

const userCardPaddingVariants = cva(
    "flex items-center justify-center border-t-2 border-foreground bg-muted text-center",
    {
        variants: {
            size: {
                small: "py-2 px-1",
                medium: "py-2 px-2",
                big: "py-3 px-3",
            },
        },
        defaultVariants: { size: "medium" },
    },
);

export function UserCard({ user, size = "medium", onClick }: UserCardProps) {
    const navigate = useNavigate();
    const myUuid = useUserUUID();
    const { isFollowing, toggleFollow } = useFollowUser(user.uuid);

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
                    className={userCardWidthVariants({ size, className: "cursor-pointer py-0" })}
                >
                    <CardContent className="flex flex-col p-0">
                        <MediaThumbnail
                            src={avatar}
                            alt={display_name}
                            className="aspect-square"
                            fallback={<Smile />}
                        />
                        <div className={userCardPaddingVariants({ size })}>
                            <p className={cardTitleVariants({ size, className: "w-full" })}>
                                {display_name}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </ContextMenuTrigger>
            {!!myUuid && user.uuid !== myUuid && (
                <ContextMenuContent panel="card" className="w-48">
                    <ContextMenuItem onSelect={toggleFollow}>
                        <MoreHorizontal className="mr-2 size-4" />
                        {isFollowing ? "Unfollow" : "Follow"}
                    </ContextMenuItem>
                </ContextMenuContent>
            )}
        </ContextMenu>
    );
}
