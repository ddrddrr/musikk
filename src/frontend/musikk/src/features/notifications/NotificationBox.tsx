import { Spinner } from "@/features/ui/spinner";
import { setNotificationRead } from "@/features/notifications/mutations.ts";
import { NotificationOverlay } from "@/features/notifications/NotificationOverlay.tsx";
import { useNotificationsQuery } from "@/features/notifications/queries.ts";
import { notificationKeys } from "@/features/notifications/queryKeys.ts";
import { Button } from "@/features/ui/button.tsx";
import { Popover, PopoverContent, PopoverTrigger } from "@/features/ui/popover.tsx";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Sparkle } from "lucide-react";
import { memo, useMemo } from "react";

export const NotificationBox = memo(function NotificationBox() {
    const client = useQueryClient();

    const { isPending, error, data } = useNotificationsQuery();
    const setNotificationsReadMutation = useMutation({ mutationFn: setNotificationRead });

    const unreadUUIDs = useMemo(() => {
        if (!data) return [];
        const { replies = [], followers = [], chat_messages = [] } = data;

        return [
            ...replies.filter((n) => !n.is_read).map((n) => n.uuid),
            ...followers.filter((n) => !n.is_read).map((n) => n.uuid),
            ...chat_messages.filter((n) => !n.is_read).map((n) => n.uuid),
        ];
    }, [data]);

    async function handleOpenChange(open: boolean) {
        if (!open && unreadUUIDs.length > 0) {
            await setNotificationsReadMutation.mutateAsync({ notificationUUIDs: unreadUUIDs });
            client.invalidateQueries({ queryKey: notificationKeys.base });
        }
    }

    if (isPending)
        return (
            <div className="flex items-center justify-center p-4">
                <Spinner />
            </div>
        );
    if (error)
        return <div className="p-4 text-center text-sm text-destructive">Error: {error.message}</div>;

    return (
        <Popover onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
                <div className="relative">
                    <Button variant="ghost" size="icon" className="text-brand-foreground">
                        <Sparkle className="size-5" />
                    </Button>
                    {unreadUUIDs.length > 0 && (
                        <span className="absolute -top-1 -right-1 rounded-full bg-amber-200 px-1.5 py-0.5 text-xs font-bold text-foreground">
                            {unreadUUIDs.length}
                        </span>
                    )}
                </div>
            </PopoverTrigger>
            <PopoverContent className="w-96 p-0">
                <NotificationOverlay notifications={data} />
            </PopoverContent>
        </Popover>
    );
});
