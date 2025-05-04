import { setNotificationRead } from "@/components/notifications/mutations.ts";
import { NotificationOverlay } from "@/components/notifications/NotificationOverlay.tsx";
import { fetchNotificationList } from "@/components/notifications/queries.ts";
import { Button } from "@/components/ui/button.tsx";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover.tsx";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Sparkle } from "lucide-react";
import { memo, useMemo } from "react";

export const NotificationBox = memo(function NotificationBox() {
    const client = useQueryClient();

    const { isPending, error, data } = useQuery({
        queryKey: ["notifications"],
        queryFn: fetchNotificationList,
    });
    const setNotificationsReadMutation = useMutation({ mutationFn: setNotificationRead });

    const unreadUUIDs = useMemo(() => {
        if (!data) return [];

        const { replies = [], friend_requests = [] } = data;

        return [
            ...replies.filter((n) => !n.is_read).map((n) => n.uuid),
            ...friend_requests.filter((n) => !n.is_read).map((n) => n.uuid),
        ];
    }, [data]);

    async function handleOpenChange(open: boolean) {
        if (!open && unreadUUIDs.length > 0) {
            await setNotificationsReadMutation.mutateAsync({ notificationUUIDs: unreadUUIDs });
            client.invalidateQueries({ queryKey: ["notifications"] });
        }
    }

    if (isPending) return <div className="text-center text-sm p-4">Loading...</div>;
    if (error) return <div className="text-center text-sm text-red-500 p-4">Error: {error.message}</div>;

    return (
        <Popover onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
                <div className="relative">
                    <Button variant="ghost" className="text-white">
                        <Sparkle className="w-5 h-5" />
                    </Button>
                    {unreadUUIDs.length > 0 && (
                        <span className="absolute -top-1 -right-1 bg-yellow-400 text-black text-xs font-bold px-1.5 py-0.5 rounded-full">
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
