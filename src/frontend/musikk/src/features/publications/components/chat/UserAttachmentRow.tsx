import { UserAvatar } from "@/features/user/components/UserAvatar.tsx";
import { BaseUser } from "@/features/user/types.ts";
import { useNavigate } from "react-router-dom";

export function UserAttachmentRow({ user }: { user: BaseUser }) {
    const navigate = useNavigate();

    return (
        <div
            className="flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 hover:bg-muted"
            onClick={() => void navigate(`/users/${user.uuid}`)}
        >
            <UserAvatar src={user.avatar} alt={user.display_name} size="sm" />
            <p className="min-w-0 truncate text-xs font-bold text-foreground">
                {user.display_name}
            </p>
        </div>
    );
}
