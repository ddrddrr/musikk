import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/modules/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/modules/ui/dropdown-menu.tsx";
import { Skeleton } from "@/modules/ui/skeleton.tsx";
import { UserAvatar } from "@/modules/user/UserAvatar.tsx";
import { useNavigate } from "react-router-dom";

export function ProfileDropdown() {
    const { user, isLoading } = useAuth();
    const navigate = useNavigate();

    if (isLoading || !user) {
        return <Skeleton className="w-8 h-8 rounded-full" />;
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="p-0 hover:bg-red-700">
                    <UserAvatar src={user.avatar} alt={user.display_name} size="sm" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                {/*TODO: add profile endpoints?*/}
                <DropdownMenuItem onSelect={() => navigate(`/users/${user.uuid}`)}>
                    Profile
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => navigate(`/users/${user.uuid}/connections`)}>
                    Connections
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
