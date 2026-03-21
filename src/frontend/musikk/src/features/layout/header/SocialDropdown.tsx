import { Button } from "@/features/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/features/ui/dropdown-menu.tsx";
import { useAuth } from "@/hooks/useAuth";
import { MessageSquareText } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function SocialDropdown() {
    const { user } = useAuth();
    const navigate = useNavigate();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-white">
                    <MessageSquareText />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuItem onSelect={() => void navigate("/feed")}>Posts</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => void navigate(`/users/${user?.uuid}/chats`)}>
                    Chats
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
