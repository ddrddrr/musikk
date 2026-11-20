import { OverflowTooltip } from "@/features/ui/tooltip.tsx";
import { UserAvatar } from "@/features/user/components/UserAvatar.tsx";
import { BaseUser } from "@/features/user/types.ts";
import { Link } from "react-router-dom";

export function UserAttachmentRow({ user }: { user: BaseUser }) {
    return (
        <Link
            to={`/users/${user.uuid}`}
            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 hover:bg-muted"
        >
            <UserAvatar src={user.avatar} alt={user.display_name} size="sm" />
            <OverflowTooltip label={user.display_name}>
                <p className="min-w-0 truncate text-xs font-bold text-foreground">
                    {user.display_name}
                </p>
            </OverflowTooltip>
        </Link>
    );
}
