import { Button } from "@/features/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/features/ui/dropdown-menu.tsx";
import { IconTooltip } from "@/features/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { MessageSquareText } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function SocialDropdown() {
    const { user } = useAuth();
    const navigate = useNavigate();

    return (
        <DropdownMenu>
            <IconTooltip label="Messages">
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Messages"
                        className="text-brand-foreground"
                    >
                        <MessageSquareText />
                    </Button>
                </DropdownMenuTrigger>
            </IconTooltip>
            <DropdownMenuContent>
                <DropdownMenuItem onSelect={() => void navigate("/feed")}>Posts</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => void navigate(`/users/${user?.uuid}/chats`)}>
                    Chats
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
