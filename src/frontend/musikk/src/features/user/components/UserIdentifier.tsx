import { Button } from "@/features/ui/button.tsx";
import { UserAvatar } from "@/features/user/components/UserAvatar.tsx";
import { BaseUser } from "@/features/user/types.ts";
import { useNavigate } from "react-router-dom";

export function UserIdentifier({ user }: { user: BaseUser }) {
    const navigate = useNavigate();
    return (
        <Button
            variant="ghost"
            size="fit"
            className="justify-start"
            onClick={() => void navigate(`/users/${user.uuid}`)}
        >
            <UserAvatar src={user.avatar} alt={user.display_name} size="sm" />
            {user.display_name}
        </Button>
    );
}
