import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/features/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/features/ui/dropdown-menu.tsx";
import { Skeleton } from "@/features/ui/skeleton.tsx";
import { UserAvatar } from "@/features/user/components/UserAvatar.tsx";
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
                <Button variant="ghost" size="icon" className="hover:bg-red-700">
                    <UserAvatar src={user.avatar} alt={user.display_name} size="sm" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
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
