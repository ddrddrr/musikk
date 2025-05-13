import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.tsx";
import { UserAvatar } from "@/components/user/UserAvatar.tsx";
import { UserContext } from "@/providers/userContext";
import { useContext } from "react";
import { useNavigate } from "react-router-dom";

export function ProfileDropdown() {
    const { user } = useContext(UserContext);
    const navigate = useNavigate();
    if (!user) return null;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="p-0 hover:bg-red-700">
                    <UserAvatar src={user.avatar} alt={user.display_name} size="sm" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuItem onSelect={() => navigate(`/users/${user.uuid}`)}>Profile</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => navigate(`/users/${user.uuid}/connections`)}>
                    Friends and Followed Artists
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
