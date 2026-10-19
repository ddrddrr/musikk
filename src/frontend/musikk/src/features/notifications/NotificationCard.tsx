import { Button } from "@/features/ui/button.tsx";
import { PopoverClose } from "@/features/ui/popover.tsx";
import { cn } from "@/lib/utils.ts";
import { formatDateTime } from "@/utils/formatDate.ts";
import { ReactNode } from "react";
import { Link } from "react-router-dom";

interface NotificationCardProps {
    title: string;
    isRead: boolean;
    dateAdded: string;
    actionLabel: string;
    actionTo: string;
    children: ReactNode;
}

export function NotificationCard({
    title,
    isRead,
    dateAdded,
    actionLabel,
    actionTo,
    children,
}: NotificationCardProps) {
    return (
        <div
            className={cn(
                "mb-2 rounded-sm border border-foreground p-3",
                isRead ? "bg-muted" : "bg-highlight",
            )}
        >
            <div className="text-sm font-semibold">{title}</div>
            {children}
            <div className="mt-2 flex justify-between">
                <span className="text-xs text-muted-foreground">{formatDateTime(dateAdded)}</span>
                {/*asChild makes PopoverClose "become" the button (merges with it) */}
                <PopoverClose asChild>
                    <Button variant="brand" className="px-3 py-1 text-xs" asChild>
                        <Link to={actionTo}>{actionLabel}</Link>
                    </Button>
                </PopoverClose>
            </div>
        </div>
    );
}
