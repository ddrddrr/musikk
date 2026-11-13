import { ActionButtonSize } from "@/features/common/types.ts";
import { Button } from "@/features/ui/button.tsx";
import { IconTooltip } from "@/features/ui/tooltip.tsx";
import { MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";

interface SongCommentsButtonProps {
    to: string;
    isOpen?: boolean;
    size?: ActionButtonSize;
}

export function SongCommentsButton({ to, isOpen = false, size = "md" }: SongCommentsButtonProps) {
    const label = isOpen ? "Hide Comments" : "Show Comments";
    const variant = isOpen ? "accent" : "muted";

    return (
        <IconTooltip label={label}>
            <Button variant={variant} size={`icon-${size}`} aria-label={label} asChild>
                <Link to={to}>
                    <MessageCircle />
                </Link>
            </Button>
        </IconTooltip>
    );
}
