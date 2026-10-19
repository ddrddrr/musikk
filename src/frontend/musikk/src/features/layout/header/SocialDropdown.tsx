import { Button } from "@/features/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/features/ui/dropdown-menu.tsx";
import { IconTooltip } from "@/features/ui/tooltip";
import { MessageSquareText } from "lucide-react";
import { Link } from "react-router-dom";

export function SocialDropdown() {
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
                <DropdownMenuItem asChild>
                    <Link to="/feed">Posts</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link to="/chats">Chats</Link>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
