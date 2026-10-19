import { ActionButtonSize } from "@/features/common/types.ts";
import { Button } from "@/features/ui/button.tsx";
import { IconTooltip } from "@/features/ui/tooltip.tsx";
import { Check, Plus } from "lucide-react";

interface LikeToggleButtonProps {
    isLiked: boolean;
    size: ActionButtonSize;
    onLike: () => void;
    onUnlike: () => void;
}

export function LikeToggleButton({ isLiked, size, onLike, onUnlike }: LikeToggleButtonProps) {
    const label = isLiked ? "Liked" : "Like";

    return (
        <IconTooltip label={label}>
            <Button
                variant={isLiked ? "brand" : "muted"}
                size={`icon-${size}`}
                aria-label={label}
                onClick={isLiked ? onUnlike : onLike}
            >
                {isLiked ? <Check /> : <Plus />}
            </Button>
        </IconTooltip>
    );
}
