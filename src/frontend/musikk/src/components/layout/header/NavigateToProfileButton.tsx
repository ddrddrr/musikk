import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/user/UserAvatar.tsx";
import { UserContext } from "@/providers/userContext";
import { useContext } from "react";
import { useNavigate } from "react-router-dom";

export function NavigateToProfileButton() {
    const { user } = useContext(UserContext);
    const navigate = useNavigate();
    if (!user) return null;

    return (
        <Button variant="ghost" className="p-0 hover:bg-red-700" onClick={() => navigate(`/users/${user.uuid}`)}>
            <UserAvatar src={user.avatar} alt={user.display_name} size="sm" />
        </Button>
    );
}
