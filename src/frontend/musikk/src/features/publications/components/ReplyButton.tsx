import { Button } from "@/features/ui/button.tsx";
import { cn } from "@/lib/utils.ts";
import { ReactNode } from "react";

interface ReplyButtonProps {
    onClick: () => void;
    children?: ReactNode;
    className?: string;
}

export function ReplyButton({ onClick, children = "Reply", className }: ReplyButtonProps) {
    return (
        <Button
            type="button"
            variant="link"
            size="fit"
            onClick={onClick}
            className={cn("p-0 text-xs text-info", className)}
        >
            {children}
        </Button>
    );
}
