import { Button } from "@/features/ui/button.tsx";
import { UserAvatar } from "@/features/user/components/UserAvatar.tsx";
import { BaseUser } from "@/features/user/types.ts";
import { Link } from "react-router-dom";

export function UserIdentifier({ user }: { user: BaseUser }) {
    return (
        <Button variant="ghost" size="fit" className="justify-start" asChild>
            <Link to={`/users/${user.uuid}`}>
                <UserAvatar src={user.avatar} alt={user.display_name} size="sm" />
                {user.display_name}
            </Link>
        </Button>
    );
}
