import { Button } from "@/modules/ui/button.tsx";
import { IUserBaseProfile } from "@/modules/user/types.ts";
import { UserAvatar } from "@/modules/user/UserAvatar.tsx";
import { useNavigate } from "react-router-dom";

export function UserIdentifier({ user }: { user: IUserBaseProfile }) {
    const navigate = useNavigate();
    return (
        <div className="flex items-center gap-2 text-sm font-medium">
            <UserAvatar src={user.avatar} alt={user.display_name} size="sm" />
            <Button
                className="p-0"
                variant={"ghost"}
                onClick={() => navigate(`/users/${user.uuid}`)}
            >
                {user.display_name}
            </Button>
        </div>
    );
}
