import { QueryErrorBox } from "@/features/common/QueryErrorBox.tsx";
import { useSetNotificationsRead } from "@/features/notifications/api/mutations.ts";
import { useNotificationsQuery } from "@/features/notifications/api/queries.ts";
import { NotificationOverlay } from "@/features/notifications/NotificationOverlay.tsx";
import { Button } from "@/features/ui/button.tsx";
import { Popover, PopoverContent, PopoverTrigger } from "@/features/ui/popover.tsx";
import { Spinner } from "@/features/ui/spinner.tsx";
import { IconTooltip } from "@/features/ui/tooltip.tsx";
import { Sparkle } from "lucide-react";
import { useMemo } from "react";

export function NotificationBox() {
    const { isPending, error, data, refetch } = useNotificationsQuery();
    const setNotificationsReadMutation = useSetNotificationsRead();

    const unreadCount = useMemo(() => {
        if (!data) return 0;
        const { replies = [], followers = [], chat_messages = [] } = data;

        return (
            replies.filter((n) => !n.is_read).length +
            followers.filter((n) => !n.is_read).length +
            chat_messages.filter((n) => !n.is_read).length
        );
    }, [data]);

    function handleOpenChange(open: boolean) {
        if (!open && unreadCount > 0) {
            setNotificationsReadMutation.mutate();
        }
    }

    function renderContent() {
        if (error) {
            return (
                <QueryErrorBox
                    message="Failed to load notifications"
                    onRetry={() => void refetch()}
                />
            );
        }
        if (isPending) {
            return (
                <div className="flex items-center justify-center p-4">
                    <Spinner />
                </div>
            );
        }
        return <NotificationOverlay notifications={data} />;
    }

    return (
        <Popover onOpenChange={handleOpenChange}>
            <IconTooltip label="Notifications">
                <PopoverTrigger asChild>
                    <div className="relative">
                        <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Notifications"
                            className="text-brand-foreground"
                        >
                            <Sparkle className="size-5" />
                        </Button>
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 rounded-full bg-highlight px-1.5 py-0.5 text-xs font-bold text-foreground">
                                {unreadCount}
                            </span>
                        )}
                    </div>
                </PopoverTrigger>
            </IconTooltip>
            <PopoverContent className="w-96 p-0">{renderContent()}</PopoverContent>
        </Popover>
    );
}
