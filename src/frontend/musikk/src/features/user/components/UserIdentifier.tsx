import { Button } from "@/features/ui/button.tsx";
import { UserAvatar } from "@/features/user/components/UserAvatar.tsx";
import { BaseUser } from "@/features/user/types.ts";
import { useNavigate } from "react-router-dom";

export function UserIdentifier({ user }: { user: BaseUser }) {
    const navigate = useNavigate();
    return (
        <div className="flex items-center gap-2 text-sm font-medium">
            <UserAvatar src={user.avatar} alt={user.display_name} size="sm" />
            <Button
                className="p-0"
                variant={"ghost"}
                onClick={() => void navigate(`/users/${user.uuid}`)}
            >
                {user.display_name}
            </Button>
        </div>
    );
}
