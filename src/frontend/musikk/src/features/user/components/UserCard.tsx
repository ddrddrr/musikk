import { useUserUUID } from "@/features/auth/hooks/useUserUUID.ts";
import { type CardSize, cardTitleVariants } from "@/features/common/card-variants.ts";
import { MediaThumbnail } from "@/features/common/MediaThumbnail.tsx";
import { StretchedLink } from "@/features/common/StretchedLink.tsx";
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

type UserCardProps = {
    user: BaseUser;
    size?: CardSize;
    onClick?: (u: BaseUser) => void;
};

const userCardWidthVariants = cva("", {
    variants: {
        size: {
            sm: "w-24",
            md: "w-40",
            lg: "w-44",
        },
    },
    defaultVariants: { size: "md" },
});

const userCardPaddingVariants = cva(
    "flex items-center justify-center border-t-2 border-foreground bg-muted text-center",
    {
        variants: {
            size: {
                sm: "py-2 px-1",
                md: "py-2 px-2",
                lg: "py-3 px-3",
            },
        },
        defaultVariants: { size: "md" },
    },
);

export function UserCard({ user, size = "md", onClick }: UserCardProps) {
    const myUuid = useUserUUID();
    const { isFollowing, toggleFollow } = useFollowUser(user.uuid);

    const { avatar, display_name } = user;

    return (
        <ContextMenu>
            <ContextMenuTrigger asChild>
                <Card
                    variant="panel"
                    className={userCardWidthVariants({ size, className: "relative py-0" })}
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
                                <StretchedLink
                                    to={`/users/${user.uuid}`}
                                    onClick={onClick && (() => onClick(user))}
                                >
                                    {display_name}
                                </StretchedLink>
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </ContextMenuTrigger>
            {user.uuid !== myUuid && (
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
